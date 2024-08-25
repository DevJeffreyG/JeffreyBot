const { FetchThisGuild } = require("../utils/");
const { GuildLog } = require("../handlers/");
const { Events } = require("discord.js");

module.exports = async (client, channel) => {
    if (!client.isThisFetched(channel.guild.id)) await FetchThisGuild(client, channel.guild);
    await new GuildLog(client, Events.ChannelCreate, [channel], ["channel"]).handle();
}