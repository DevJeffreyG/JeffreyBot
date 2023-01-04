const Discord = require("discord.js");
const { Command, Categories, isBannedFrom, FindNewId, DataWork, Embed, ErrorEmbed, Log, ChannelModules, LogReasons } = require("../../src/utils");
const { Colores } = require("../../src/resources");
const { ButtonStyle } = require("discord-api-types/v10");
const { codeBlock } = require("discord.js");

const command = new Command({
    name: "sug",
    desc: "¡Envía una sugerencia directamente al STAFF para mejorar el servidor!",
    category: Categories.General
})

command.addOption({
    type: "string",
    name: "sugerencia",
    desc: "Los usuarios y el STAFF verán esta sugerencia :)",
    req: true
})

command.execute = async (interaction, models, params, client) => {

    await interaction.deferReply({ ephemeral: true });

    const { Guilds } = models;
    const sugerencia = params.sugerencia.value;

    if (await isBannedFrom(interaction, "SUGGESTIONS")) return new ErrorEmbed(interaction, { type: "moduleBanned" }).send();

    const docGuild = await Guilds.getOrCreate(interaction.guild.id);
    if(!docGuild.moduleIsActive("functions.suggestions")) return new ErrorEmbed(interaction, {type: "moduleDisabled"}).send();

    const newId = await FindNewId(await Guilds.find(), "data.suggestions", "id"); // crear la nueva id para el ticket

    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId("acceptSuggestion")
                .setLabel("Aprobar")
                .setStyle(ButtonStyle.Primary),
            new Discord.ButtonBuilder()
                .setCustomId("denySuggestion")
                .setLabel("Rechazar")
                .setStyle(ButtonStyle.Secondary),

            new Discord.ButtonBuilder()
                .setCustomId("invalidateSuggestion")
                .setLabel("Invalidar")
                .setStyle(ButtonStyle.Danger)
        )

    let embed = new Embed()
        .defAuthor({ text: interaction.user.tag, icon: interaction.member.displayAvatarURL() })
        .defTitle("Sugerencia")
        .defDesc(`**—** Por: ${interaction.member}
**—** Sugiere:
${codeBlock(sugerencia)}
**—** ID: \`${newId}\`.`)
        .defColor(Colores.verdejeffrey);

    let msg = await new Log(interaction)
        .setTarget(ChannelModules.SuggestionLogs)
        .setReason(LogReasons.Suggestion)
        .send({ embeds: [embed], components: [row] });

    if(!msg) return;

    await msg.react(client.Emojis.Check);
    await msg.react(client.Emojis.Cross);

    docGuild.data.suggestions.push({
        user_id: interaction.user.id,
        channel_id: msg.channel.id,
        message_id: msg.id,
        suggestion: sugerencia,
        id: newId
    });

    await docGuild.save();

    return interaction.editReply({ content: "✅ ¡Gracias!" });

}

module.exports = command;