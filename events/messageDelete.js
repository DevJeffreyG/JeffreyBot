const { AuditLogEvent } = require("discord.js");
const { Colores } = require("../src/resources/");
const { FetchAuditLogs, GenerateLog, EndReasons, FetchThisGuild } = require("../src/utils");
const { Users } = require("mongoose").models;

module.exports = async (client, message) => {
  if (!client.isThisFetched(message.guild.id)) await FetchThisGuild(client, message.guild);
  const author = message.author;
  const logs = await FetchAuditLogs(client, message.guild, [AuditLogEvent.MessageDelete, AuditLogEvent.MessageBulkDelete]);
  if (logs) {
    let info = logs[0]

    await GenerateLog(message.guild, {
      header: `Se ha eliminado un mensaje`,
      footer: `Eliminado por ${info?.executor.username ?? "un usuario"}`,
      description: [
        `${info?.target.username ?? "Sin información del autor"}`,
        `${message.content ?? message.embeds[0]?.description ?? "Sin información del mensaje"}`,
        `ID: \`${message.id}\`.`
      ],
      header_icon: info?.target.displayAvatarURL({ dynamic: true }) ?? message.guild.iconURL({ dynamic: true }),
      footer_icon: info?.executor.displayAvatarURL({ dynamic: true }),
      color: Colores.verdejeffrey
    })
  }

  if (author && message.guild) {

    let user = await Users.getWork({ user_id: author.id, guild_id: message.guild.id });

    // Si el usuario tiene Cooldown
    // Y el mensaje eliminado se encuentra entre los últimos enviados...
    if (user.data.cooldowns.chat_rewards && user.data.lastGained.messages.find(x => x === message.id)) {
      user.removeCurrency(user.data.lastGained.currency);
      user.economy.global.exp -= user.data.lastGained.exp;

      console.log("🟡 %s perdió %s EXP y %s %s en #%s", author.username, user.data.lastGained.exp, user.data.lastGained.currency, client.getCustomEmojis(message.guild.id).Currency.name, message.channel.name);

      await user.save();
    }
  }

  let filteredCollectors = client.activeCollectors.filter(x => {
    return x.channelid === message.channel.id
  });

  filteredCollectors.forEach(async collector => {
    try {
      await collector.manager.interaction.fetchReply().then(x => console.log(x));
    } catch (err) {
      console.log("🔴 Se eliminará el Collector porque ya no existe el mensaje")
      collector.manager.raw().stop(EndReasons.Deleted);
    }
  })

}