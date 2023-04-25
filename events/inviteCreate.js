const { time } = require("discord.js");
const { GenerateLog, FetchThisGuild } = require("../src/utils/");
const { Colores } = require("../src/resources");

module.exports = async (client, invite) => {
    if (!client.isThisFetched(invite.guild.id)) await FetchThisGuild(client, invite.guild);

    client.invites[invite.code] = invite.uses;

    await GenerateLog(invite.guild, {
        header: "Se ha creado una invitación",
        footer: `${invite.inviter.tag}`,
        description: [
            `${invite.inviter} ha creado la invitación.`,
            `discord.gg/${invite.code}`,
            `Expira: ${new Date() > invite.expiresAt ? "Nunca" : time(invite.expiresAt)}`
        ],
        footer_icon: invite.inviter.displayAvatarURL(),
        color: Colores.verdejeffrey
    });
}