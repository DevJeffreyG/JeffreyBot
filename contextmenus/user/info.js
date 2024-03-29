const { ApplicationCommandType } = require("discord.js")
const { ContextMenu, Categories } = require("../../src/utils")

const command = new ContextMenu({
    name: "Información: Usuario",
    type: ApplicationCommandType.User,
    category: Categories.Staff
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const userinfo = require("../../commands/staff/userinfo");
    const member = interaction.guild.members.cache.get(params.user.id)

    params["usuario"] = { member };

    try {
        await userinfo.execute(interaction, models, params, client)
    } catch (err) {
        console.log(err);
    }
}

module.exports = command;