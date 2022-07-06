const Discord = require("discord.js");
const { Command, isBannedFrom, FindNewId, DataWork, Embed } = require("../../src/utils");
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "sug",
    desc: "¡Envía una sugerencia directamente al STAFF para mejorar el servidor!",
    category: "GENERAL"
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

    if(await isBannedFrom(interaction, "SUGGESTIONS")) return;

    let logChannel = await DataWork(interaction, "STAFF_LOGS_CHANNEL");
    if(!logChannel) return;

    const docGuild = await Guilds.findOne({guild_id: interaction.guild.id});

    const newId = await FindNewId(await Guilds.find(), "data.suggestions", "id"); // crear la nueva id para el ticket

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