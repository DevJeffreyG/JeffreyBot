const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");
const reglas = require("../../src/resources/reglas.json");

const { Initialize, TutorialEmbed, Confirmation, AfterInfraction, FindNewId } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "warn",
    aliases: ["w"],
    info: "Comando usado para agregar warns a los usuarios",
    params: [
        {
            name: "miembro", type: "Member", optional: false
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

        collector.on("collect", async(collected) => {
            const rule = Number(collected.values[0]) ?? collected.values[0];

            console.log(collected)

            await collected.deferUpdate();

            if(rule === "cancel"){
                message.delete();
                return selectRuleMsg.delete();
            }
        
            const user = await User.findOne({
                user_id: member.id,
                guild_id: member.guild.id
            });

            // Definir cuál es la regla "rule"
            let ruleTxt = reglas[rule].regla;

            let toConfirm = [
                `¿Estás segur@ de warnear a **${member.user.tag}**?`,
                `Razón: Infringir la regla N°${rule} (${ruleTxt})`,
                `[Pruebas](${proof.url})`
            ];
            let confirmation = await Confirmation("Agregar Warn", toConfirm, message);

            if(!confirmation) return selectRuleMsg.delete();

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
                if(!confirmation) return selectRuleMsg.delete();
            }

            // como sí tiene el soft, agregar warn
            let users = await User.find();
            
            let newId = await FindNewId(users, "warns", "id");

            warns.push({rule_id: rule, proof: proof.url, id: newId});
            if(hasSoft) softwarns.splice(indexOfSoftwarn, 1);
            await user.save();

            const data = {
                member: member,
                rule: ruleTxt,
                proof: proof,
                message: confirmation,
                id: newId
            }
            
            await AfterInfraction(user, data); // enviar mensaje con la informacion del warn al usuario

            let log = new Discord.MessageEmbed()
            .setAuthor(`Warn`, Config.bienPng)
            .setDescription(`**—** Warneado: **${member}**.
**—** Warns actuales: **${user.warns.length}**.
**—** Por infringir la regla: **${ruleTxt}**.
**—** ID: \`${newId}\`.`)
            .setColor(Colores.rojo);

            let proofE = new Discord.MessageEmbed()
            .setTitle("Pruebas")
            .setDescription(proof.url)
            .setImage(proof.url)
            .setColor(Colores.nocolor);

            confirmation.edit({embeds: [log, proofE]});
            selectRuleMsg.delete();
        })
    }
}