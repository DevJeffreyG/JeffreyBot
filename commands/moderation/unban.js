const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const GlobalData = require("../../modelos/globalData.js");

/* ##### MONGOOSE ######## */
const commandInfo = {
    name: "unban",
    info: "Desbanear a un usuario",
    params: [
        {
            name: "userID", display: "id", type: "String", optional: false
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

        // Comando
        let user = response.find(x => x.param === "userID").data;
        let logC = client.user.id === Config.testingJBID ? message.guild.channels.cache.find(x => x.id === "483108734604804107") : message.guild.channels.cache.find(x => x.id === Config.logChannel);

        let bEmbed = new Discord.MessageEmbed()
        .setAuthor(`Unban`, author.displayAvatarURL())
        .setDescription(`**—** Usuario desbaneado: **${user}**.
**—** Moderador: **${message.author.username}**.`)
        .setColor(Colores.verde);

        await GlobalData.findOneAndRemove({
            "info.type": "temporalGuildBan",
            "info.guild_id": guild.id,
            "info.userID": user
        });
        
        await guild.members.unban(user)
        message.react("✅");
        
        logC.send({embeds: [bEmbed]});
    }
}