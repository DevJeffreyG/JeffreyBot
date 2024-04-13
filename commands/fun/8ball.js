const { Command, Embed } = require("../../src/utils");
const { Colores } = require("../../src/resources");

const Chance = require("chance");

const command = new Command({
    name: "8ball",
    desc: "¡No necesita presentación!"
})

command.addOption({
    type: "string",
    name: "pregunta",
    desc: "¿Qué deseas saber?",
    req: true,
    min: 1
})

command.execute = async (interaction, models, params, client) => {
    let replies = ["Sí.", "No.", "No lo sé", "Te mentiría si no.", "¿Estamos tontos?", "Obvio.", "Bastante claro que no.", "La verdad es que no.", "La verdad, sí."];

    const { pregunta } = params;

    let pregEmbed = new Embed()
        .defColor(Colores.verde)
        .defAuthor({ text: `${interaction.member.displayName} pregunta:`, icon: interaction.member.displayAvatarURL() })
        .defDesc(`# ${pregunta.value}...\n### ${client.Emojis.JeffreyBot} ${client.user.displayName}: "${new Chance().pickone(replies)}"`);

    return interaction.deferred ? await interaction.editReply({ embeds: [pregEmbed] }) : await interaction.reply({ embeds: [pregEmbed] });
}

module.exports = command;