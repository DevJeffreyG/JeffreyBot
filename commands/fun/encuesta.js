const { Command, Categories, Embed } = require("../../src/utils");
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "encuesta",
    desc: "Crea una encuesta para que la gente en el chat vote",
    category: Categories.Fun
})

command.addOption({
    type: "string",
    name: "encuesta",
    desc: "La encuesta a hacer",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const encuesta = params.encuesta.value;

    let footers = [
        "🤔🤔🤔🤔🤔🤔🤔",
        "¿Qué opinarán...?",
        "¡Que la voz hable!",
        "¡Aprendan, STAFF!"
    ]

    let embed = new Embed()
        .defAuthor({ text: `¡Nueva encuesta por ${interaction.user.username}!`, icon: interaction.member.displayAvatarURL() })
        .defDesc(encuesta)
        .defColor(Colores.verde)
        .defFooter({ text: footers[Math.floor(Math.random() * footers.length)] })

    let msg = await interaction.editReply({ embeds: [embed] });

    await msg.react(client.Emojis.Check);
    await msg.react("🤷");
    await msg.react(client.Emojis.Cross);
}

module.exports = command;