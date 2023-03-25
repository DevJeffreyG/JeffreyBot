const { time } = require("discord.js");
const { GenerateLog } = require("../src/utils/");
const { Colores } = require("../src/resources");

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
        footer_icon: invite.inviter.displayAvatarURL(),
        color: Colores.verdejeffrey
    });
}