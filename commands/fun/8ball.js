const { Command, Categories, Embed } = require("../../src/utils");
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "8ball",
    desc: "¡No necesita presentación!",
    category: Categories.Fun
})

command.addOption({
    type: "string",
    name: "pregunta",
    desc: "¿Qué deseas saber?",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    let replies = ["Sí.", "No.", "No lo sé", "Te mentiría si no.", "¿Estamos tontos?", "Obvio.", "Bastante claro que no.", "La verdad es que no.", "La verdad, sí."];

    let answer = Math.floor(Math.random() * replies.length);
    const {pregunta} = params;
    if(pregunta.value.length == 0) return interaction.editReply({content: "No hubo una pregunta..."})

    let pregEmbed = new Embed()
      .defColor(Colores.verde)
      .defAuthor({text: `${interaction.user.tag}`, icon: interaction.member.displayAvatarURL()})
      .defField("Pregunta", pregunta.value)
      .defField("Respuesta", replies[answer]);

    return interaction.deferred ? interaction.editReply({embeds: [pregEmbed]}) : interaction.reply({embeds: [pregEmbed]});
}

module.exports = command;