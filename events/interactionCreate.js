const { Client } = require("discord.js");

const { GlobalDatasWork } = require("../src/utils");
const Handlers = require("../Handlers");

/**
 * 
 * @param {Client} client 
 * @param {Interaction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
  if (!client.fetchedGuilds.find(x => x === interaction.guild.id) && interaction.inGuild()) {
    await client.guilds.fetch(interaction.guild.id);
    await interaction.guild.channels.fetch();
    await interaction.guild.roles.fetch();
    await interaction.guild.members.fetch();

    client.fetchedGuilds.push(interaction.guild.id)
    console.log("💚 %s fetched!", interaction.guild.name)
  }

  client.lastInteraction = interaction;
  /* const guild = interaction.guild;

  await GlobalDatasWork(guild, true); */

  new Handlers(interaction);
}