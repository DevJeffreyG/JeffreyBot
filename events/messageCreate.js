const { Bases } = require("../src/resources/");
const { Log, ChannelModules, LogReasons, Cooldowns, Multipliers, RequirementType, ErrorEmbed, UpdateCommands, DeleteLink, FetchThisGuild, BoostWork, MinMaxInt } = require("../src/utils");

const { GlobalDatasWork } = require("../src/utils/");
const { ChannelType, codeBlock, Client, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require("discord.js");
const Chance = require("chance");

const { Users, Guilds } = require("mongoose").models;

/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @returns 
 */
module.exports = async (client, message) => {
  // Captcha.
  if (message.author.bot) return;
  if (message.channel.type === ChannelType.DM) {
    if (!Bases.devIds.find(x => x === message.author.id)) return;

    if (message.content === "~commands") {
      try {
        await UpdateCommands(client)

        message.reply("[DEV] Se actualizaron los comandos")
      } catch (err) {
        message.reply({ content: `[DEV] Hubo un error al actualizar los comandos.\n${codeBlock("json", err)}` });
        console.log(err)
      }
    }

    if (message.content === "~lockdown") {
      client.isOnLockdown = true;

      message.reply("[DEV] Se activó el lockdown. `~lockdownoff`")
    }

    if (message.content === "~lockdownoff") {
      client.isOnLockdown = false;

      message.reply("[DEV] Se desactivó el lockdown.")
    }

    if (message.content === "~ping") {
      message.reply({
        content: `**v${client.version}** ${time(client.readyAt)} (${time(client.readyAt, "R")}) Pong!`,
        components: [
          new ActionRowBuilder()
            .setComponents(
              new ButtonBuilder()
                .setCustomId(`KILL-${client.readyTimestamp}-${client.user.id}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("Kill")
            )
        ]
      })
    }

    return;
  }

  if (!client.isThisFetched(message.guild.id)) await FetchThisGuild(client, message.guild);

  const doc = await Guilds.getWork(message.guild.id);
  const guild = message.guild;
  const author = message.author;

  // buscar usuario
  const user = await Users.getWork({
    user_id: author.id,
    guild_id: guild.id
  });

  if (await DeleteLink(message)) return;

  // JEFFROS & EXP
  const chat_rewards = doc.channels.chat_rewards;
  const channels = new Map();

  for await (const chat_reward of chat_rewards) {
    let ch = await guild.channels.fetch(chat_reward.channel);
    channels.set(ch.id, { channel: ch, multiplier: chat_reward.multiplier });
  }

  let configured = channels.get(message.channel.id)

  if (configured) { // Está dentro de los canales configurados
    const { multiplier } = configured;

    const minMoney = doc.settings.quantities.limits.chat_rewards.currency.min;
    const maxMoney = doc.settings.quantities.limits.chat_rewards.currency.max;

    const minExp = doc.settings.quantities.limits.chat_rewards.exp.min;
    const maxExp = doc.settings.quantities.limits.chat_rewards.exp.max;

    let cool = await user.cooldown(Cooldowns.ChatRewards, { save: false });
    if (cool) return;

    // Multiplicadores
    const multipliers = doc.getMultipliers(Multipliers.ChatRewards);
    let customMultiplier = 1;

    for (const mult of multipliers) {
      switchWork:
      switch (mult.req_type) {
        case RequirementType.Level:
          if (user.economy.global.level >= mult.requirement) customMultiplier += mult.multiplier;
          break switchWork;

        case RequirementType.Role:
          if (message.member.roles.cache.get(mult.requirement)) customMultiplier += mult.multiplier;
          break switchWork;
      }
    }

    const toMultiply = customMultiplier * multiplier;

    await GlobalDatasWork(guild, true); // verificar si existen BOOSTS.
    const boost = BoostWork(user);

    let currencyToAdd = MinMaxInt(minMoney, maxMoney, {guild, msg: `No se ha podido agregar ${client.getCustomEmojis(guild.id).Currency.name}`})* toMultiply;
    let expToAdd = MinMaxInt(minExp, maxExp, {guild, msg: `No se ha podido agregar EXP`})* toMultiply;

    if(doc.toAdjust("chat_rewards")) {
      let average = doc.data.average_currency;

      if(average / currencyToAdd > 10000) {
        currencyToAdd += Math.round(average * 0.001);
      }
    }

    if(boost.hasMultiplierChanges()) {
      currencyToAdd *= boost.multiplier.currency_value;
      expToAdd *= boost.multiplier.exp_value;
    }

    await user.addCurrency(currencyToAdd)
    user.economy.global.exp += expToAdd;

    console.log("🟢 %s ganó %s EXP y %s %s en #%s", author.username, expToAdd, currencyToAdd, client.getCustomEmojis(guild.id).Currency.name, message.channel.name);

    user.data.lastGained.currency = currencyToAdd;
    user.data.lastGained.exp = expToAdd;
    await user.save();
  }
}