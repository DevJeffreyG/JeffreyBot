const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "canjear",
    aliases: ["redeem", "canj"],
    info: "Canjeas alguna clave para recompensas dentro del servidor",
    params: [
        {
            name: "llave", type: "String", optional: false
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

        const key = response.find(x => x.param === "llave").data;

        // Comando
        // validar key

        
    }
}