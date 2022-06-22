const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "ticket",
    aliases: ["ticketpanel"],
    info: "Crear el mensaje con el cuál los usuarios crean sus tickets",
    params: [
    ],
    userlevel: "ADMIN",
    category: "STAFF"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando
        let embed = new Discord.MessageEmbed()
        .setTitle("NUEVO TICKET")
        .setDescription("¿Necesitas ayuda? ¿Alguna duda? ¿Warn/Softwarn injusto?\nPulsa el botón de aquí abajo para crear un ticket para hablar directamente con el STAFF.")
        .setColor(Colores.verdeclaro);

        let row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setCustomId("createTicket")
                .setLabel("CREAR TICKET")
                .setStyle("SUCCESS")
                .setEmoji("🎫")
        );

        message.delete();
        return message.channel.send({embeds: [embed], components: [row]});

    }
}