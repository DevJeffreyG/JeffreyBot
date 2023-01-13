const { Colores } = require("../src/resources/");
const { Embed, Log, ChannelModules, LogReasons, Cooldowns, BoostTypes, BoostObjetives, Multipliers, RequirementType, ErrorEmbed } = require("../src/utils");

const links = [
  "https", "http", "www.", "discord.gg", "discord.gift"
];

const { GlobalDatasWork } = require("../src/utils/");
const { ChannelType, PermissionsBitField, codeBlock, Client, Message } = require("discord.js");
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
  if (message.channel.type === ChannelType.DM) return;

  const doc = await Guilds.getOrCreate(message.guild.id);
  const guild = message.guild;
  const author = message.author;
  const member = message.member;

  await GlobalDatasWork(guild, true); // verificar si existen BOOSTS.

  // buscar usuario
  const user = await Users.getOrCreate({
    user_id: author.id,
    guild_id: guild.id
  });

  // links
  const link = links.some(x => message.content.includes(x));

  if (doc.moduleIsActive("automoderation.remove_links") && !member.permissions.missing(PermissionsBitField.Flags.EmbedLinks).length > 0) {
    if (link) deleteLink(message)
    else if (message.embeds.length > 0) deleteLink(message)

    function deleteLink(message) {
      message.delete();
      message.author.send({
        embeds: [
          new Embed()
            .defAuthor({ text: `No envíes links`, title: true })
            .defDesc(`Detecté que incluiste un link en tu mensaje:
${codeBlock(message.content)}`)
            .defFooter({ text: `Discúlpame si fue un error :)`, icon: guild.iconURL({ dynamic: true }) })
            .defColor(Colores.rojo)
        ]
      })
        .catch(async err => {
          let msg = await message.channel.send(`No envíes links, **${author.tag}**.`)

          setTimeout(() => {
            msg.delete();
          })
        });

      new Log(message)
        .setTarget(ChannelModules.ModerationLogs)
        .setReason(LogReasons.AutoMod)
        .send({
          embeds: [
            new Embed()
              .defAuthor({ text: `Se eliminó un mensaje de ${author.tag}`, icon: member.displayAvatarURL({ dynamic: true }) })
              .defDesc(`${codeBlock(message.content)}`)
              .defColor(Colores.verde)
              .defFooter({ text: "NO se aplicaron sanciones", timestamp: true })
          ]
        })
    }
  }

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