const { Command, Embed } = require("../../src/utils");
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "encuesta",
    desc: "Crea una encuesta para que la gente en el chat vote",
    category: "FUN"
})

command.addOption({
    type: "string",
    name: "encuesta",
    desc: "Literalmente la encuesta",
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
    .defAuthor({text: `¡Nueva encuesta por ${interaction.user.username}!`, icon: interaction.member.displayAvatarURL()})
    .defDesc(encuesta)
    .defColor(Colores.verde)
    .defFooter({text: footers[Math.floor(Math.random() * footers.length)]})

    let msg = await interaction.editReply({embeds: [embed]});

    await msg.react("✅");
    await msg.react("🤷");
    await msg.react("❌");
}

module.exports = command;