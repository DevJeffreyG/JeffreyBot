const { Colores } = require("../src/resources");
const { GenerateLog, DeleteLink, FetchThisGuild } = require("../src/utils/functions");
const { codeBlock } = require("discord.js");

module.exports = async (client, oldMessage, message) => {
  const prefix = "/";
  const member = message.member;

  if (!member) return;

  if (member.user.bot) return;
  if (message.channel.type === "DM") return;
  if (member.user.bot) return;
  if (message.content.startsWith(prefix)) return;

  if (!client.isThisFetched(message.guild.id)) await FetchThisGuild(client, message.guild);

  await GenerateLog(message.guild, {
    header: `Se ha editado un mensaje`,
    footer: `${member.user.username}`,
    description: [
      `Ahora: ${codeBlock(message.content)}`,
      `Antes: ${codeBlock(oldMessage.content) ?? codeBlock("js", "null")}`,
      `ID: \`${message.id}\`.`
    ],
    header_icon: message.guild.iconURL({ dynamic: true }),
    footer_icon: member.displayAvatarURL({ dynamic: true }),
    color: Colores.verdejeffrey
  })

  DeleteLink(message)
}