const { ApplicationCommandType, MessageFlags } = require("discord.js")
const { ContextMenu } = require("../../../utils")

const command = new ContextMenu({
    name: "Perdonar préstamo",
    type: ApplicationCommandType.User
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const perdonar = require("../perdonar");
    const member = interaction.guild.members.cache.get(params.user.id)

    params["usuario"] = { member, value: params.user.id };

    await perdonar.execute(interaction, models, params, client);
}

module.exports = command;