const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");
const reglas = require("../../src/resources/reglas.json");

const { Initialize, TutorialEmbed, Confirmation, AfterInfraction, FindNewId } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "softwarn",
    aliases: ["soft"],
    info: "Softwarneas a un usuario",
    params: [
        {
            name: "miembro", type: "NotSelfMember", optional: false
        },
        {
            name: "prueba", display: "adjuntar imagen", type: "Attachment", optional: false
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
        const proof = response.find(x => x.param === "prueba").data;
        
        // Comando
        let selectMenu = new Discord.MessageSelectMenu()
        .setCustomId("selectRule")
        .setPlaceholder("Selecciona la regla infringida");

        for (let i = 1; i <= Object.keys(reglas).length; i++) {
            const regla = reglas[i];

            selectMenu.addOptions({label: regla.regla, value: i.toString(), description: regla.description});
        }

        selectMenu.addOptions({label: "Cancelar", value: "cancel", emoji: "❌"});

        let row = new Discord.MessageActionRow().addComponents([selectMenu]);

        let selectRuleMsg = await message.reply({content: "**¿Qué regla infringió?**", components: [row]})

        const filter = (interaction) => interaction.isSelectMenu() && interaction.user.id === author.id;

        const collector = message.channel.createMessageComponentCollector({filter, max: "1"});

        collector.on("collect", async collected => {
            const rule = collected.values[0];

            await collected.deferUpdate();

            const user = await User.findOne({
                user_id: member.id,
                guild_id: member.guild.id
            });

            // Definir cuál es la regla "rule"
            let ruleTxt = reglas[rule].regla;

            let toConfirm = [
                `¿Estás segur@ de softwarnear a **${member.user.tag}**?`,
                `Llamado de atención: Incumplimiento de la regla N°${rule} (${ruleTxt})`,
                `[Pruebas](${proof.url})`
            ];
            let confirmation = await Confirmation("Agregar softwarn", toConfirm, message);

            if(!confirmation) return selectRuleMsg.delete();

            const softwarns = user.softwarns;

            // como se confirmó, primero revisar si tiene el softwarn para después agregar el warn
            let hasSoft = false;
            let indexOfSoftwarn;
            softwarns.forEach((soft) => {
                if(soft.rule_id === rule){
                    hasSoft = true;
                    indexOfSoftwarn = softwarns.indexOf(soft);
                }
            })

            let alreadyWarned = new Discord.MessageEmbed()
            .setAuthor(`Agregar softwarn: Error`, guild.iconURL())
            .setColor(Colores.rojo)
            .setDescription(`**—** **${member.user.tag}** ya ha sido softwarneado por infringir la regla N°${rule}: \`${ruleTxt}\`.
**—** Proceder con \`${prefix}warn\`.`);

            if(hasSoft) return confirmation.edit({embeds: [alreadyWarned]});

            // como no tiene el soft, agregarlo
            let users = await User.find();
            let newId = await FindNewId(users, "softwarns", "id");

            softwarns.push({rule_id: rule, proof: proof.url, id: newId});
            await user.save();

            const data = {
                member: member,
                rule: ruleTxt,
                proof: proof,
                message: confirmation,
                id: newId
            }

            await AfterInfraction(user, data, true);

            let log = new Discord.MessageEmbed()
            .setAuthor(`Softwarn`, Config.bienPng)
            .setDescription(`**—** Softwarneado: **${member}**.
**—** Softwarns actuales: **${user.softwarns.length}**.
**—** Por infringir la regla: **${ruleTxt}**.`)
            .setColor(Colores.rojo);

            let proofE = new Discord.MessageEmbed()
            .setTitle("Pruebas")
            .setDescription(proof.url)
            .setImage(proof.url)
            .setColor(Colores.nocolor);

            confirmation.edit({embeds: [log, proofE]});
    })
}
}