const { ApplicationCommandType } = require("discord.js")
const { ContextMenu } = require("../../../src/utils")

const command = new ContextMenu({
    name: "[DS] Estadísticas",
    type: ApplicationCommandType.User
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const stats = require("../darkstats");
    const member = interaction.guild.members.cache.get(params.user.id)

    params["usuario"] =  { member };

    try {
        await stats.execute(interaction, models, params, client)
    } catch (err) {
        console.log(err);
    }
}

module.exports = command;