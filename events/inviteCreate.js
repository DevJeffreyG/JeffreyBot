const { time } = require("discord.js");
const { GenerateLog } = require("../src/utils/");
const Colores = require("../src/resources/colores.json");

module.exports = async (client, invite) => {
    client.invites[invite.code] = invite.uses;

    GenerateLog(invite.guild, {
        header: "Se ha creado una invitación",
        footer: `${invite.inviter.tag}`,
        description: [
            `${invite.inviter} ha creado la invitación.`,
            `discord.gg/${invite.code}`,
            `Expira: ${new Date() > invite.expiresAt ? "Nunca" : time(invite.expiresAt)}`
        ],
        header_icon: invite.inviter.displayAvatarURL(),
        footer_icon: invite.guild.iconURL(),
        color: Colores.verdejeffrey
    });
}