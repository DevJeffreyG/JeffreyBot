const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../src/utils/");
const { ToggledCommands } = require("mongoose").models;

const commandInfo = {
    name: "togglecommand",
    aliases: ["toggle"],
    info: "Habilita o deshabilita un comando del bot, slash, o comando normal",
    params: [
        {
            name: "comando", type: "String", optional: false
        },
        {
            name: "razon", type: "JoinString", optional: true
        }
    ],
    userlevel: "DEVELOPER",
    category: "DEVELOPER"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const comando = response.find(x => x.param === "comando").data;
        const reason = response.find(x => x.param === "razon").data || "Mantenimiento";
        
        let removed = new Discord.MessageEmbed()
        .setAuthor(`Eliminado`, Config.bienPng)
        .setDescription(`**—** Se ha eliminado el comando \`${prefix}${comando}\`.`)
        .setColor(Colores.verde);
        
        let added = new Discord.MessageEmbed()
        .setAuthor(`Toggled`, Config.bienPng)
        .setDescription(`**—** Se ha agregado el comando \`${prefix}${comando}\`.`)
        .setColor(Colores.verde);

        // Comando
        ToggledCommands.findOne({
            command: comando
        }, (err, toggle) => {
            if(err) throw err;

            if(!toggle){
                new ToggledCommands({
                    command: comando,
                    reason: reason
                }).save();

                return message.channel.send({embeds: [added]})
            } else {
                toggle.remove();

                return message.channel.send({embeds: [removed]})
            }
        })
    }
}