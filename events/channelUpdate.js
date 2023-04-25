const { FetchAuditLogs, GetChangesAndCreateFields, FetchThisGuild } = require("../src/utils/");

const { AuditLogEvent } = require("discord.js");

module.exports = async (client, oldchannel, channel) => {
    if (!client.isThisFetched(channel.guild.id)) await FetchThisGuild(client, channel.guild);
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

    /* await GenerateLog(channel.guild, {
        header: `Se ha actualizado ${type}`,
        description: [
            `${channel}`,
            `ID: \`${channel.id}\`.`
        ],
        color: Colores.verdejeffrey,
        fields
    }); */
}