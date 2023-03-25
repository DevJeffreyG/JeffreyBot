const { Command, Categories } = require("../../src/utils");

const command = new Command({
    name: "changelog",
    desc: "Las últimas modificaciones hechas en la versión actual del bot",
    category: Categories.General
})
command.execute = async (interaction, models, params, client) => {
    return interaction.reply({ content: `Mira los últimos cambios en la página: ${process.env.HOME_PAGE}/changelog 🦊` });
}

module.exports = command;