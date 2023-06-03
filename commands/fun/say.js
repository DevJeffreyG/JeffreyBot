const { Command, Categories } = require("../../src/utils");

const command = new Command({
    name: "say",
    desc: "Repito lo que me digas"
})

command.addOption({
    type: "string",
    name: "mensaje",
    desc: "Lo que quieras que diga",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const mensaje = params.mensaje.value;

    interaction.deleteReply();
    return interaction.channel.send({ content: mensaje, allowedMentions: { parse: [] } });
}

module.exports = command;