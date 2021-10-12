const Colores = require("../../resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

const commandInfo = {
    name: "findemoji",
    aliases: ["findemote", "emoji", "emote"],
    info: "Sacar el ID de un emoji por su nombre",
    params: [
        {
            name: "nombre", display: "nombre del emoji", type: "String", optional: false
        },
        {
            name: "guild", display: "id del server", type: "Guild", optional: true
        }
    ],
    userlevel: "DEVELOPER",
    category: "DEVELOPER"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const emojiName = response.find(x => x.param === "nombre").data;
        const guild = response.find(x => x.param === "guild").data || message.guild;

        // Comando
        const emoji = guild.emojis.cache.find(x => x.name === emojiName);
        if(!emoji) return message.reply(`No encontré ese emoji, verifica que hayas escrito bien el nombre.`);

        let finalEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Emote: ${emojiName}`, emoji.url)
        .setDescription(`**—** Nombre del Role: \`${emojiName}\`.
**—** ID: \`${emoji.id}\`.
**—** Es animado: \`${emoji.animated ? "Sí" : "No"}\`.
**—** Emoji del server: \`${guild.name}\`.`)
        .setColor(Colores.verde);

        return message.channel.send({embeds: [finalEmbed]});
    }
}