const { Command } = require("../../utils");
const { hyperlink } = require("discord.js");

const command = new Command({
    name: "changelog",
    desc: "Las últimas modificaciones hechas en la versión actual del bot"
})
command.execute = async (interaction, models, params, client) => {
    return await interaction.reply({ content: `${client.Emojis.JeffreyBot} Mira los últimos cambios en la ${hyperlink("página web", `${process.env.DASHBOARD}/changelog`)} 🦊` });
}

module.exports = command;