const { Client } = require("discord.js");

const { FetchThisGuild } = require("../src/utils");
const Handlers = require("../Handlers");

/**
 * 
 * @param {Client} client 
 * @param {Interaction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
  if (!client.isThisFetched(interaction.guild.id) && interaction.inGuild()) await FetchThisGuild(client, interaction.guild);

  client.lastInteraction = interaction;
  /* const guild = interaction.guild;

  await GlobalDatasWork(guild, true); */

  new Handlers(interaction);
}