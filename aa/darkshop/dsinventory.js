const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");
const DarkShop = require("../../modelos/DarkShop.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "dsinventory",
    aliases: ["darkinventory", "dsinv", "darkinv", "dinv"],
    info: "Muestra los items que tengas en tu inventario de la DarkShop",
    userlevel: "USER",
    category: "DARKSHOP"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando

        let commandFile = require("../economy/inventory.js");

        args.push("true");
        return commandFile.execute(client, message, args);
    }
}