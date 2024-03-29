const { ApplicationCommandType } = require("discord.js");
const { ContextMenu, Categories } = require("../../src/utils");

const command = new ContextMenu({
    name: "Pregúntale a la 8ball",
    type: ApplicationCommandType.Message,
    category: Categories.Fun
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    params["pregunta"] = {
        value: params.message.content
    }

    const generate = require("../../commands/fun/8ball");
    await generate.execute(interaction, models, params, client)
}

module.exports = command;