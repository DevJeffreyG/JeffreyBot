const { Command } = require("../../src/utils")

const command = new Command({
    name: "actividad",
    desc: "Cambia la actividad default del bot",
    category: "DEV"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ephemeral: true});
    interaction.editReply({content: "PERO QUE PASA"});
}

module.exports = command;