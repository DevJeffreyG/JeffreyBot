const { GenerateLog, FetchThisGuild } = require("../utils/");
const { Colores } = require("../resources");

module.exports = async (client, channel) => {
    if (!client.isThisFetched(channel.guild.id)) await FetchThisGuild(client, channel.guild);
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

    await GenerateLog(channel.guild, {
        header: `Se ha eliminado ${type}`,
        description: [
            `#${channel.name}`,
            `ID: \`${channel.id}\`.`
        ],
        color: Colores.verdejeffrey
    });
}