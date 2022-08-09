const Discord = require("discord.js");

const Config = require("../src/resources/base.json");
const { disableAwards, jeffreygID } = Config;

const { Guilds } = require("mongoose").models;;

module.exports = async (client, reaction, user) => {
    if (user.bot) return;
    if(!reaction) return; // wtf?

    const guild = reaction.message.guild;
    const message = reaction.message;

    const doc = await Guilds.getOrCreate(guild.id);
    doc.workerRemoveAutoRole(message, reaction, user)
}