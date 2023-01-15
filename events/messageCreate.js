const { Bases } = require("../src/resources/");
const { Log, ChannelModules, LogReasons, Cooldowns, BoostTypes, BoostObjetives, Multipliers, RequirementType, ErrorEmbed, UpdateCommands, DeleteLink } = require("../src/utils");

const { GlobalDatasWork } = require("../src/utils/");
const { ChannelType, codeBlock, Client, Message } = require("discord.js");
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
    if(!Bases.devIds.find(x => x === message.author.id)) return;

    if(message.content === "~commands") {
      try {
        await UpdateCommands(client)

        message.reply("[DEV] Se actualizaron los comandos")
      } catch (err) {
        message.reply({content: `[DEV] Hubo un error al actualizar los comandos.\n${codeBlock("json", err)}`});
      }
    }

    return;
  }

  const doc = await Guilds.getOrCreate(message.guild.id);
  const guild = message.guild;
  const author = message.author;

  await GlobalDatasWork(guild, true); // verificar si existen BOOSTS.

  // buscar usuario
  const user = await Users.getOrCreate({
    user_id: author.id,
    guild_id: guild.id
  });

  if(await DeleteLink(message)) return;

  // JEFFROS & EXP
  const chat_rewards = doc.channels.chat_rewards;
  const channels = new Map();

  for await (const chat_reward of chat_rewards) {
    let ch = await guild.channels.fetch(chat_reward.channel);
    channels.set(ch.id, { channel: ch, multiplier: chat_reward.multiplier });
  }

  let configured = channels.get(message.channel.id)

  if (configured) { // Está dentro de los canales configurados
    const {  multiplier } = configured;

    const minMoney = doc.settings.quantities.min_curr;
    const maxMoney = doc.settings.quantities.max_curr;

    const minExp = doc.settings.quantities.min_exp;
    const maxExp = doc.settings.quantities.max_exp;

    let cool = await user.cooldown(Cooldowns.ChatRewards, { save: false });
    if (cool) return;

    // Multiplicadores
    const multipliers = doc.getMultipliers(Multipliers.ChatRewards);
    let customMultiplier = 1;

    for(const mult of multipliers) {
      switchWork:
      switch(mult.req_type){
        case RequirementType.Level:
          if(user.economy.global.level >= mult.requirement) customMultiplier += mult.multiplier;
          break switchWork;
        
        case RequirementType.Role:
          if(message.member.roles.cache.get(mult.requirement)) customMultiplier += mult.multiplier;
          break switchWork;
      }
    }

    const toMultiply = customMultiplier * multiplier;

    try {
      var currencyToAdd = new Chance().integer({ min: minMoney, max: maxMoney }) * toMultiply
      var expToAdd = new Chance().integer({ min: minExp, max: maxExp }) * toMultiply
    } catch (err) {
      if(err instanceof RangeError) {
        new Log(message)
        .setReason(LogReasons.Error)
        .setTarget(ChannelModules.StaffLogs)
        .send({
          embeds: [
            new ErrorEmbed()
            .defDesc(`No se ha podido agregar ni EXP ni ${client.getCustomEmojis(guild.id).Currency.name}. Mínimos y máximos deben ser menores y mayores los unos con los otros. \`/config dashboard\`.`)
            .defFields([
              { up: "Min Money", down: String(minMoney), inline: true },
              { up: "Max Money", down: String(maxMoney), inline: true },
              { up: "||                             ||", down: String(" ") },
              { up: "Min EXP", down: String(minExp), inline: true },
              { up: "Max EXP", down: String(maxExp), inline: true }
            ])
            .raw()
          ]
        });

        currencyToAdd = 0;
        expToAdd = 0;
      }
    }

    // TempRoles
    for (let i = 0; i < user.data.temp_roles.length; i++) {
      const temprole = user.data.temp_roles[i];
      const specialInfo = temprole.special;

      if (specialInfo.type === BoostTypes.Multiplier) {
        if (specialInfo.objetive === BoostObjetives.Currency) {
          currencyToAdd *= Number(specialInfo.value);
        }

        if (specialInfo.objetive === BoostObjetives.Exp) {
          expToAdd *= Number(specialInfo.value);
        }

        if(specialInfo.objetive === BoostObjetives.All) {
          currencyToAdd *= Number(specialInfo.value)
          expToAdd *= Number(specialInfo.value)
        }
      }
    }

    await user.addCurrency(currencyToAdd)
    user.economy.global.exp += expToAdd;

    user.data.lastGained.currency = currencyToAdd;
    user.data.lastGained.exp = expToAdd;
    await user.save();
  }
}