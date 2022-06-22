const Discord = require("discord.js");

const { GenerateLog, FetchAuditLogs, GetChangesAndCreateFields } = require("../src/utils/");
const Colores = require("../src/resources/colores.json");

module.exports = async (client, oldchannel, channel) => {
    const guild = channel.guild;

    const logs = await FetchAuditLogs(client, guild, ["CHANNEL_UPDATE", "CHANNEL_OVERWRITE_UPDATE"]);

    let type;
    switch(channel.type){
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

    GenerateLog(channel.guild, `Se ha actualizado ${type}`, "", [
        `${channel}`,
        `ID: \`${channel.id}\`.`
    ], channel.guild.iconURL(), null, Colores.verdejeffrey, "GENERAL", fields);
}