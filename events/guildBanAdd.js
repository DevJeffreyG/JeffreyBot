const { Colores } = require("../src/resources");
const { GenerateLog, ChannelModules, LogReasons, FetchThisGuild } = require("../src/utils/");

module.exports = async (client, ban) => {
    await ban.fetch();
    const guild = ban.guild;

    if (!client.isThisFetched(guild.id)) await FetchThisGuild(client, guild);

    await GenerateLog(guild, {
        logType: ChannelModules.ModerationLogs,
        logReason: LogReasons.Ban,
        header: `Se ha baneado un usuario`,
        description: [
            `**${ban.user.username}** (\`${ban.user.id}\`)`,
            `Razón: ${ban.reason}.`
        ],
        color: Colores.verdejeffrey
    });
}