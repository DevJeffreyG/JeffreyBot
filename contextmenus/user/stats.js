const { ApplicationCommandType } = require("discord.js")
const { ContextMenu, Categories } = require("../../src/utils")

const command = new ContextMenu({
    name: "Estadísticas",
    type: ApplicationCommandType.User,
    category: Categories.Economy
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const stats = require("../../commands/economy/stats");
    const member = interaction.guild.members.cache.get(params.user.id)

    stats.execute(interaction, models, { usuario: { member } }, client)
}

module.exports = command;