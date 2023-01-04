const { Colores } = require("../src/resources");
const { GenerateLog, ChannelModules, LogReasons } = require("../src/utils/");

module.exports = async (client, ban) => {
    const guild = ban.guild;

    GenerateLog(guild, {
        logType: ChannelModules.ModerationLogs,
        logReason: LogReasons.Ban,
        header: `Se ha desbaneado un usuario`,
        description: [
            `**${ban.user.tag}** (\`${ban.user.id}\`)`,
            `Baneado por: ${ban.reason}.`
        ],
        color: Colores.verdejeffrey
    });
}