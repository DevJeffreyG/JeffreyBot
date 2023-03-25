const { Colores } = require("../src/resources");
const { GenerateLog, ChannelModules, LogReasons } = require("../src/utils/");

module.exports = async (client, ban) => {
    await ban.fetch();
    const guild = ban.guild;

    GenerateLog(guild, {
        logType: ChannelModules.ModerationLogs,
        logReason: LogReasons.Ban,
        header: `Se ha baneado un usuario`,
        description: [
            `**${ban.user.tag}** (\`${ban.user.id}\`)`,
            `Razón: ${ban.reason}.`
        ],
        color: Colores.verdejeffrey
    });
}