const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Discord = require("discord.js");
const reglas = require("../../resources/reglas.json");

const { Initialize, TutorialEmbed, Confirmation, AfterInfraction } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "warn",
    aliases: ["w"],
    info: "Comando usado para agregar warns a los usuarios",
    params: [
        {
            name: "miembro", type: "NotSelfMember", optional: false
        },
        {
            name: "regla", display: "N° Regla", type: "Number", optional: false
        },
        {
            name: "prueba", display: "url msg de prueba | adjuntar imagen", type: "MessageLink", optional: true
        }
    ],
    userlevel: "STAFF",
    category: "MODERATION"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const member = response.find(x => x.param === "miembro").data;
        const rule = response.find(x => x.param === "regla").data;
        let proof = response.find(x => x.param === "prueba").data || null;
        
        // Comando

        if(!proof && message.attachments.size === 0) return message.reply("Si no hay un link de mensaje como prueba, debes adjuntar UNA imagen al mensaje como prueba.");
        let proofIsAtt = false;

        if(message.attachments.size != 0) { // si hay attachements, hacer proof
            proof = message.attachments.first();
            proofIsAtt = true
        }

        const user = await User.findOne({
            user_id: member.id,
            guild_id: member.guild.id
        });

        // Definir cuál es la regla "rule"
        let ruleTxt = reglas[rule];

        let toConfirm = [
            `¿Estás segur@ de warnear a **${member.user.tag}**?`,
            `Razón: Infringir la regla N°${rule} (${ruleTxt})`,
            `[Pruebas](${proof.url})`
        ];
        let confirmation = await Confirmation("Agregar Warn", toConfirm, message);

        if(!confirmation) return;

        const softwarns = user.softwarns;
        const warns = user.warns;

        // como se confirmó, primero revisar si tiene el softwarn para después agregar el warn
        let hasSoft = false;
        let indexOfSoftwarn;
        softwarns.forEach((soft) => {
            if(soft.rule_id === rule){
                hasSoft = true;
                indexOfSoftwarn = softwarns.indexOf(soft);
            }
        });

        if(!hasSoft) {
            await confirmation.delete();
            let skipConfirmation = [
                `**${member.user.tag}** __NO__ tiene el **softwarn** de la regla "${ruleTxt}"`,
                `¿Estás segur@ de warnear a **${member.user.tag}**?`,
                `Razón: Infringir la regla N°${rule} (${ruleTxt})`,
                `[Pruebas](${proof.url})`
            ];
            confirmation = await Confirmation("Continuar", skipConfirmation, message);
            if(!confirmation) return;
        }

        // como sí tiene el soft, agregar warn
        let idsNow = []; // ids en uso actualmente
        let newId = 1;

        let users = await User.find();

        for (let i = 0; i < users.length; i++) {
            const document = users[i];
            
            let warns = document.warns;

            warns.forEach(warn => {
                idsNow.push(warn.id); // pushear cada id en uso
            });
        }

        while (idsNow.find(x => x === newId)){ // mientras se encuentre la id en las que ya están en uso sumar una hasta que ya no lo esté
            newId++;
        }

        warns.push({rule_id: rule, proof: proof.url, id: newId});
        if(hasSoft) softwarns.splice(indexOfSoftwarn, 1);
        await user.save();

        const data = {
            member: member,
            rule: ruleTxt,
            proof: proof,
            message: confirmation
        }
        
        await AfterInfraction(user, data); // enviar mensaje con la informacion del warn al usuario

        let log = new Discord.MessageEmbed()
        .setAuthor(`| Warn`, Config.bienPng)
        .setDescription(`**—** Warneado: **${member}**.
**—** Warns actuales: **${user.warns.length}**.
**—** Por infringir la regla: **${ruleTxt}**.`)
        .setColor(Colores.rojo);

        let proofE = new Discord.MessageEmbed()
        .setTitle("Pruebas")
        .setDescription(proofIsAtt ? proof.url : `[Mensaje](${proof.url})`)
        .setImage(proofIsAtt ? proof.url : null)
        .setColor(Colores.nocolor);

        confirmation.edit({embeds: [log, proofE]});
    }
}