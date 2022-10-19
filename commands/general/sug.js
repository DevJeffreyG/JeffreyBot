const Discord = require("discord.js");
const { Command, Categories, isBannedFrom, FindNewId, DataWork, Embed, ErrorEmbed } = require("../../src/utils");
const { Colores } = require("../../src/resources");
const { ButtonStyle } = require("discord-api-types/v10");

const command = new Command({
    name: "sug",
    desc: "¡Envía una sugerencia directamente al STAFF para mejorar el servidor!",
    category: Categories.General
})

command.addOption({
    type: "string",
    name: "sugerencia",
    desc: "Recuerda que esto lo ven los miembros del STAFF, y pueden quitarte el acceso a este comando.",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ephemeral: true});

    const { Guilds } = models;
    const sugerencia = params.sugerencia.value;

    if(await isBannedFrom(interaction, "SUGGESTIONS")) return new ErrorEmbed(interaction, { type: "moduleBanned" }).send();

    let logChannel = await DataWork(interaction, "OPINION_LOGS_CHANNEL");
    if(!logChannel) return;

    const docGuild = await Guilds.getOrCreate(interaction.guild.id);

    const newId = await FindNewId(await Guilds.find(), "data.suggestions", "id"); // crear la nueva id para el ticket

    const row = new Discord.ActionRowBuilder()
    .addComponents(
        new Discord.ButtonBuilder()
            .setCustomId("acceptSuggestion")
            .setLabel("Aceptar")
            .setStyle(ButtonStyle.Primary),
        new Discord.ButtonBuilder()
            .setCustomId("denySuggestion")
            .setLabel("Denegar")
            .setStyle(ButtonStyle.Secondary),

        new Discord.ButtonBuilder()
            .setCustomId("invalidateSuggestion")
            .setLabel("Invalidar")
            .setStyle(ButtonStyle.Danger)
    )

    let embed = new Embed()
    .defAuthor({text: "Nueva sugerencia", icon: interaction.member.displayAvatarURL()})
    .defDesc(`**—** Por: ${interaction.member}
**—** Sugiere:
\`\`\`
${sugerencia}
\`\`\`
**—** ID: \`${newId}\`.`)
    .defColor(Colores.verdejeffrey);

    let msg = await logChannel.send({embeds: [embed], components: [row]});

    docGuild.data.suggestions.push({
        user_id: interaction.user.id,
        channel_id: msg.channel.id,
        message_id: msg.id,
        suggestion: sugerencia,
        id: newId
    });

    await docGuild.save();

    return interaction.editReply({content: "✅ ¡Gracias!"});
}

module.exports = command;