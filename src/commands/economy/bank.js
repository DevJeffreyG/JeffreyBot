const { Command } = require("../../utils")

const command = new Command({
    name: "bank",
    desc: "Revisa el banco del servidor"
})

command.execute = async (interaction, models, params, client) => {
    if (!interaction.deferred) await interaction.deferReply();
    const { subcommand } = params;

    await interaction.deleteReply();

    // TODO: 2.2.X? - Jeffrey Bot será el banco de un servidor
}

module.exports = command;