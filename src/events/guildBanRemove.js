const { Colores } = require("../resources");
const { GenerateLog, ChannelModules, LogReasons, FetchThisGuild } = require("../utils/");

module.exports = async (client, ban) => {
    const guild = ban.guild;
    if (!client.isThisFetched(guild.id)) await FetchThisGuild(client, guild);

    await GenerateLog(guild, {
        logType: ChannelModules.ModerationLogs,
        logReason: LogReasons.Ban,
        header: `Se ha desbaneado un usuario`,
        description: [
            `**${ban.user.username}** (\`${ban.user.id}\`)`,
            `Baneado por: ${ban.reason}.`
        ],
        color: Colores.verdejeffrey
    });
}