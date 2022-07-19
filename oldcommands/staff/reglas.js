const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");
const reglas = require("../../src/resources/reglas.json");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "reglas",
    aliases: ["rules"],
    info: "Un embed con las reglas usadas en algunos de los comandos de moderación",
    params: [],
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

        // Get the size of an object
        var size = Object.keys(reglas).length;
            
        //errores
        let rulesEmbed = new Discord.EmbedBuilder()
        .setAuthor(`Reglas`, Config.jeffreyguildIcon)
        .setColor(Colores.verde)
        .setDescription(`▸ Las reglas enumeradas que son usadas en comandos como \`${prefix}softwarn\` y \`${prefix}warn\`.`)
        //agregar cada regla de la variable de reglas
        for(let i = 1; i <= size; i++){
            rulesEmbed.addField(reglas[i].regla, `N° **${i}**`);
        }

        return message.channel.send({embeds: [rulesEmbed]});

    }
}