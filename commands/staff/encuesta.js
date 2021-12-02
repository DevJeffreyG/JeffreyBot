const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

const commandInfo = {
    name: "encuesta",
    aliases: ["poll"],
    info: "Información del comando",
    params: [
        {
            name: "encuesta", type: "JoinString", optional: false
        }
    ],
    userlevel: "STAFF",
    category: "STAFF"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando
        await message.react("✅");
        await message.react("🤷");
        await message.react("❌");
    }
}