const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "syncmute",
    aliases: ["smute"],
    info: "Sincronizar automáticamente el role Muted predeterminado o uno dado",
    params: [
        {
            name: "role", type: "Role", optional: true
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

        let defaultmuteRole = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "544691532104728597") : guild.roles.cache.find(x => x.id === Config.muteRole);

        const role = response.find(x => x.param === "role").data || defaultmuteRole;

        // Comando
        message.guild.channels.cache.each(async (channel, id) => {
            await channel.permissionOverwrites.edit(role, {
              VIEW_CHANNEL: false,
              SEND_MESSAGES: false,
              ADD_REACTIONS: false
            })
            .catch(err => console.log(err));
        });

        await message.react("✅");
    }
}