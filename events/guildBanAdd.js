const { Colores } = require("../src/resources");
const { GenerateLog } = require("../src/utils/");

module.exports = async (client, ban) => {
    const guild = ban.guild;

    GenerateLog(guild, {
        header: `Se ha baneado un usuario`,
        description: [
            `**${ban.user.tag}** (\`${ban.user.id}\`)`,
            `Razón: ${ban.reason}.`
        ],
        color: Colores.verdejeffrey,
        fields
    });
}