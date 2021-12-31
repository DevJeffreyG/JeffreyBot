const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, Confirmation, isBannedFrom, FindNewId, DataWork } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const Guild = require("../../modelos/Guild.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "sug",
    aliases: ["suggest", "sugerencia", "sugerencias", "sugerir"],
    info: "Envía una sugerencia directamente al STAFF para mejorar el servidor!",
    params: [
        {
            name: "sugerencia", type: "JoinString", optional: false
        }
    ],
    userlevel: "USER",
    category: "GENERAL"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const sugerencia = response.find(x => x.param === "sugerencia").data;
        // Comando

        if(await isBannedFrom(message, "SUGGESTIONS")) return;

        let logChannel = await DataWork(message, "STAFF_LOGS_CHANNEL");

        const docGuild = await Guild.findOne({guild_id: guild.id});

        const newId = await FindNewId(await Guild.find(), "data.suggestions", "id"); // crear la nueva id para el ticket

        const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageButton()
                .setCustomId("acceptSuggestion")
                .setLabel("Aceptar")
                .setStyle("PRIMARY"),
            new Discord.MessageButton()
                .setCustomId("denySuggestion")
                .setLabel("Denegar")
                .setStyle("SECONDARY"),

            new Discord.MessageButton()
                .setCustomId("invalidateSuggestion")
                .setLabel("Invalidar")
                .setStyle("DANGER")
        )

        let embed = new Discord.MessageEmbed()
        .setAuthor("Nueva sugerencia", author.displayAvatarURL())
        .setDescription(`**—** Por: ${message.member}
**—** Sugiere:
\`\`\`
${sugerencia}
\`\`\`
**—** ID: \`${newId}\`.`)
        .setColor(Colores.verdejeffrey);

        let msg = await logChannel.send({embeds: [embed], components: [row]});

        docGuild.data.suggestions.push({
            user_id: author.id,
            channel_id: msg.channel.id,
            message_id: msg.id,
            suggestion: sugerencia,
            id: newId
        });

        await docGuild.save();

        return message.react("✅");

    }
}