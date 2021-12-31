const Discord = require("discord.js");

const { time } = require("@discordjs/builders");
const { GenerateLog } = require("../resources/functions.js");
const Colores = require("../resources/colores.json");

module.exports = async (client, invite) => {
    client.invites[invite.code] = invite.uses;
    
    GenerateLog(invite.guild, "Se ha creado una invitación", "", [
        `${invite.inviter} ha creado la invitación.`,
        `discord.gg/${invite.code}`,
        `Expira: ${new Date() > invite.expiresAt ? "Nunca" : time(invite.expiresAt)}`
    ], invite.inviter.displayAvatarURL(), invite.guild.iconURL(), Colores.verdejeffrey);
}