const { AuditLogEvent } = require("discord.js");
const { Bases, Colores } = require("../src/resources/");
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
      footer: `Eliminado por ${info?.executor.tag ?? "un usuario"}`,
      description: [
        `${info?.target.tag ?? "Sin información del autor"}`,
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

    if (user.data.cooldowns.chat_rewards) {
      if (message.channel.id != Bases.owner.channels.mainChannel) return; // TODO: arreglar esto ############################################

      let global = user.economy.global

      let nxtLvl = 10 * ((global.level - 1) ** 2) + 50 * (global.level - 1) + 100; // fórmula de MEE6.

      global.currency -= user.data.lastGained.currency;


      if (global.exp - user.data.lastGained.exp >= nxtLvl) console.log("Subió de nivel");
      else {
        global.exp -= user.data.lastGained.exp;
      }

      await user.save();

      console.log(global.currency, global.exp, author.username);
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