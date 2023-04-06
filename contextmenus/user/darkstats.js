const { ApplicationCommandType } = require("discord.js")
const { ContextMenu, Categories } = require("../../src/utils")

const command = new ContextMenu({
    name: "[DS] Estadísticas",
    type: ApplicationCommandType.User,
    category: Categories.DarkShop
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const stats = require("../../commands/darkshop/darkstats");
    const member = interaction.guild.members.cache.get(params.user.id)

    try {
        await stats.execute(interaction, models, { usuario: { member } }, client)
    } catch (err) {
        console.log(err);
    }
}

module.exports = command;