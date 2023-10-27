const { Command } = require("../../src/utils")

const command = new Command({
    name: "bank",
    desc: "Revisa el banco del servidor"
})

command.execute = async (interaction, models, params, client) => {
    if (!interaction.deferred) await interaction.deferReply();
    const { subcommand } = params;
}

module.exports = command;