const { time, codeBlock, ModalBuilder, Client, TextInputBuilder, ActionRowBuilder } = require("discord.js");

const models = require("mongoose").models;
const { ToggledCommands, Users, Guilds } = models

const { Ticket, ErrorEmbed, GlobalDatasWork, Categories, ValidateDarkShop, Embed, Confirmation, Log, LogReasons, ChannelModules } = require("../src/utils");
const { Config, Colores, Bases } = require("../src/resources");
const { InteractionType, TextInputStyle } = require("discord-api-types/v10");
const Handlers = require("../Handlers");
const { jeffreygID, mantenimiento } = Config;

/**
 * 
 * @param {Client} client 
 * @param {Interaction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
  if (!client.fetchedGuilds.find(x => x === interaction.guild.id)) {
    await client.guilds.fetch(interaction.guild.id);
    await interaction.guild.channels.fetch();
    await interaction.guild.roles.fetch();
    await interaction.guild.members.fetch();

    client.fetchedGuilds.push(interaction.guild.id)
    console.log("💚 %s fetched!", interaction.guild.name)
  }

  client.lastInteraction = interaction;
  const guild = interaction.guild;

  await GlobalDatasWork(guild);

  new Handlers(interaction);
}