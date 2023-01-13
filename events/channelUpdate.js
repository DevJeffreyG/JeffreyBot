const { GenerateLog, FetchAuditLogs, GetChangesAndCreateFields } = require("../src/utils/");
const { Colores } = require("../src/resources");

const { AuditLogEvent } = require("discord.js");

module.exports = async (client, oldchannel, channel) => {
    const guild = channel.guild;

    const logs = await FetchAuditLogs(client, guild, [AuditLogEvent.ChannelUpdate, AuditLogEvent.ChannelOverwriteUpdate]);
    if (!logs) return;

    let type;
    switch (channel.type) {
        case "GUILD_TEXT":
            type = "un canal de texto";
            break;

        case "GUILD_VOICE":
            type = "un canal de voz";
            break;

        case "GUILD_CATEGORY":
            type = "una categoría";
            break;

        default:
            type = "un canal";
    }

    let fields = await GetChangesAndCreateFields(logs);

    GenerateLog(channel.guild, {
        header: `Se ha actualizado ${type}`,
        description: [
            `${channel}`,
            `ID: \`${channel.id}\`.`
        ],
        color: Colores.verdejeffrey,
        fields
    });
}