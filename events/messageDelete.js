const { AuditLogEvent } = require("discord-api-types/v10");
const { Config, Colores } = require("../src/resources/");
const { FetchAuditLogs, GenerateLog } = require("../src/utils");
const { Users } = require("mongoose").models;

module.exports = async (client, message) => {
  const author = message.author;
  const logs = await FetchAuditLogs(client, message.guild, [AuditLogEvent.MessageDelete, AuditLogEvent.MessageBulkDelete]);

  let info = logs[0]

  GenerateLog(message.guild, {
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

  if (!author) return

  let user = await Users.getOrCreate({ user_id: author.id, guild_id: message.guild.id });

  if (user.data.cooldowns.chat_rewards) {
    if (message.channel.id != Config.mainChannel) return; // arreglar esto ############################################

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