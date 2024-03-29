const { ButtonStyle, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { Command, Categories, isBannedFrom, FindNewId, Embed, ErrorEmbed, Log, ChannelModules, LogReasons } = require("../../src/utils");
const { Colores } = require("../../src/resources");
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
    max: 3000,
    req: true
})

command.execute = async (interaction, models, params, client) => {

    await interaction.deferReply({ ephemeral: true });

    const { Guilds } = models;
    const sugerencia = params.sugerencia.value;

    const docGuild = params.getDoc();
    if (!docGuild.moduleIsActive("functions.suggestions")) return new ErrorEmbed(interaction, { type: "moduleDisabled" }).send();
    if (await isBannedFrom(interaction, "SUGGESTIONS")) return new ErrorEmbed(interaction, { type: "moduleBanned" }).send();

    const newId = FindNewId(await Guilds.find(), "data.suggestions", "id"); // crear la nueva id para el ticket

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("acceptSuggestion")
                .setLabel("Aprobar")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("denySuggestion")
                .setLabel("Rechazar")
                .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
                .setCustomId("invalidateSuggestion")
                .setLabel("Invalidar")
                .setStyle(ButtonStyle.Danger)
        )

    let embed = new Embed()
        .defAuthor({ text: interaction.user.tag, icon: interaction.member.displayAvatarURL() })
        .defTitle("Sugerencia")
        .defDesc(`**—** ${interaction.member} Sugiere:
${codeBlock(sugerencia)}
**—** ID: \`${newId}\`.`)
        .defColor(Colores.verdejeffrey);

    let msg = await new Log(interaction)
        .setTarget(ChannelModules.SuggestionLogs)
        .setReason(LogReasons.Suggestion)
        .send({ embeds: [embed], components: [row] });

    if (!msg) return;

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

    return interaction.editReply({ content: `${client.Emojis.Check} ¡Gracias!` });

}

module.exports = command;