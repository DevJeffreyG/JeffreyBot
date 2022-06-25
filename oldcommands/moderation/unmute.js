const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");
const { Users } = require("mongoose").models;

const commandInfo = {
    name: "unmute",
    aliases: ["desmutear"],
    info: "Desmuteas a una persona",
    params: [
        {
            name: "miembro", type: "Member", optional: false
        }
    ],
    userlevel: "STAFF",
    category: "MODERATION"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error
        const member = response.find(x => x.param === "miembro").data;

        // Comando
        const muteRole = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "544691532104728597") : guild.roles.cache.find(x => x.id === Config.muteRole);
        
        const user = await Users.findOne({
            user_id: member.id,
            guild_id: member.guild.id
        });
        
        const f = x => x.role_id === muteRole.id;

        if(user.data.temp_roles.find(f)){
            user.data.temp_roles.splice(user.data.temp_roles.findIndex(f), 1);
            await user.save();
        }

        return member.roles.remove(muteRole).then(() => message.react("✅"));
    }
}