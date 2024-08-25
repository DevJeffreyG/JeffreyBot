const { Command } = require("../../utils");

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
    await interaction.deleteReply();

    return await interaction.channel.send({ content: params.mensaje.value, allowedMentions: { parse: [] } });
}

module.exports = command;