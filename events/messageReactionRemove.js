const { codeBlock, hyperlink } = require("discord.js");
const { Log, ChannelModules, LogReasons, ErrorEmbed } = require("../src/utils");

const { Guilds } = require("mongoose").models;;

module.exports = async (client, reaction, user) => {
    if (user.bot) return;
    if (!reaction?.count) return;

    const guild = reaction.message.guild;
    const message = reaction.message;

    const doc = await Guilds.getOrCreate(guild.id);

    doc.workerRemoveAutoRole(message, reaction, user)
}