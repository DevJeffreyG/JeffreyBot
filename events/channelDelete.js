const { GenerateLog } = require("../src/utils/");
const { Colores } = require("../src/resources");

module.exports = async (client, channel) => {
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

    GenerateLog(channel.guild, {
        header: `Se ha eliminado ${type}`,
        description: [
            `#${channel.name}`,
            `ID: \`${channel.id}\`.`
        ],
        color: Colores.verdejeffrey
    });
}