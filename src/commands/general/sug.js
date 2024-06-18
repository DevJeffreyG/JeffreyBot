const { ButtonStyle, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { Command, isBannedFrom, FindNewId, Embed, Log, ChannelModules, LogReasons } = require("../../utils");
const { Colores } = require("../../resources");
const { codeBlock } = require("discord.js");
const { ModuleBannedError, ModuleDisabledError } = require("../../errors");

const command = new Command({
    name: "sug",
    desc: "¡Envía una sugerencia directamente al STAFF para mejorar el servidor!"
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
    if (!docGuild.moduleIsActive("functions.suggestions")) throw new ModuleDisabledError(interaction);
    if (await isBannedFrom(interaction, "SUGGESTIONS")) throw new ModuleBannedError(interaction);

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
        .defAuthor({ text: `${interaction.member.displayName} sugiere:`, icon: interaction.member.displayAvatarURL() })
        .defDesc(`${codeBlock(sugerencia)}
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

    await interaction.editReply({ content: `${client.Emojis.Check} ¡Gracias!` });

}

module.exports = command;