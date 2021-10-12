const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

const commandInfo = {
    name: "hackban",
    aliases: ["habn"],
    info: "Baneas a un usuario que no está en el servidor, ideal para los raiders",
    params: [
        {
            name: "userID", display: "id", type: "String", optional: false
        },
        {
            name: "razon", type: "JoinString", optional: true
        }
    ],
    userlevel: "ADMIN",
    category: "MODERATION"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        let user = response.find(x => x.param === "userID").data;
        let reason = response.find(x => x.param === "razon").data || "Hackban, sin especificar.";
        let logC = client.user.id === Config.testingJBID ? message.guild.channels.cache.find(x => x.id === "483108734604804107") : message.guild.channels.cache.find(x => x.id === Config.logChannel);

        // Comando
        let bEmbed = new Discord.MessageEmbed()
        .setAuthor(`| HackBan`, author.displayAvatarURL())
          .setDescription(`**—** Usuario baneado { ID }: **${user}**.
**—** Usuario baneado { @ }: <@${user}>
**—** Ban en: **${message.channel}**.
**—** Moderador: **${message.author.username}**.
**—** Tiempo: **${message.createdAt}**.
**—** Razón de ban: **${reason}**.`)
          .setColor(Colores.rojo);
      
          message.guild.members.ban(user, {reason: reason})
          .then(() => message.react("✅")); // Baneado
          logC.send({embeds: [bEmbed]});

    }
}