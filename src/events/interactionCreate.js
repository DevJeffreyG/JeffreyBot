const { Client } = require("discord.js");

const { FetchThisGuild } = require("../utils");
const Handlers = require("../app/Handlers");

/**
 * 
 * @param {Client} client 
 * @param {Interaction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
  if (!client.isThisFetched(interaction.guild.id) && interaction.inGuild()) await FetchThisGuild(client, interaction.guild);

  client.lastInteraction = interaction;
  new Handlers(interaction);
}