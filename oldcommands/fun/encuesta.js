const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "encuesta",
    aliases: ["poll"],
    info: "Crea una encuesta para que la gente en el chat vote",
    params: [
        {
            name: "encuesta", type: "JoinString", optional: false
        }
    ],
    userlevel: "USER",
    category: "FUN"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const encuesta = response.find(x => x.param === "encuesta").data;

        // Comando
        let footers = [
            "🤔🤔🤔🤔🤔🤔🤔",
            "¿Qué opinarán...?",
            "¡Que la voz hable!",
            "¡Aprendan, STAFF!"
        ]
        let embed = new Discord.MessageEmbed()
        .setAuthor(`¡Nueva encuesta por ${author.username}!`, author.displayAvatarURL())
        .setDescription(encuesta)
        .setColor(Colores.verde)
        .setFooter(footers[Math.floor(Math.random() * footers.length)])

        await message.delete();
        let msg = await message.channel.send({embeds: [embed]});

        await msg.react("✅");
        await msg.react("🤷");
        await msg.react("❌");
    }
}