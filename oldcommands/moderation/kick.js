const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "kick",
    info: "Kickeas a un usuario",
    params: [
        {
            name: "member", display: "miembro", type: "NotSelfMember", optional: false
        },
        {
            name: "reason", display: "razón", type: "JoinString", optional: true
        }
    ],
    userlevel: "STAFF",
    category: "MODERATION"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo, staff_role } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando
        let member = await response.find(x => x.param === "member").data;
        let reason = await response.find(x => x.param === "reason").data || "Sin especificar.";

        let logC = client.user.id === Config.testingJBID ? message.guild.channels.cache.find(x => x.id === "483108734604804107") : message.guild.channels.cache.find(x => x.id === Config.logChannel);
    
        // Si el usuario a kickear tiene el permiso de kickear también
        if(member.roles.cache.find(x => x.id === staff_role.id)) return console.log("NO.");
    
        let bEmbed = new Discord.EmbedBuilder()
      .setAuthor(`Kick`, author.displayAvatarURL())
        .setDescription(`**—** Usuario kickeado: **${member}**.
**—** Mod: **${message.author.username}**.`)
        .setColor(Colores.rojo)
        .setFooter(reason)
        .setTimestamp();
    
        try {
            await member.kick({reason: reason}); // Kick
        } catch (e) {
            return message.reply("Ha habido un error kickeando a este usuario.");
        }
        
        message.react("✅")
        logC.send({embeds: [bEmbed]});
    }
}