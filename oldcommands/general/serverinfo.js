const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "serverinfo",
    aliases: ["server"],
    info: "Información del servidor",
    params: [],
    userlevel: "USER",
    category: "GENERAL"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo, admin_role, mod_role } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando
        let admins = admin_role.members.map(user => user).length > 0 ? admin_role.members.map(user => user) : "Que silencio por aquí...";
        let mods = mod_role.members.map(user => user).length > 0 ? mod_role.members.map(user => user) : "Que silencio por aquí...";
      
        let serverembed = new Discord.MessageEmbed()
        .setTitle(`Información del server — ${message.guild.name}`)
        .setColor(Colores.verde)
        .setThumbnail(message.guild.iconURL())
        .setDescription(`**— Creado el:** ${message.guild.createdAt}
        **— Tú te uniste el:** ${message.member.joinedAt}
        **— Miembros totales:** ${message.guild.memberCount}`)
        .addField(`— @${admin_role.name}`, `${admins}`)
        .addField(`— @${mod_role.name}`, `${mods}`)
        return message.channel.send({embeds: [serverembed]});
    }
}