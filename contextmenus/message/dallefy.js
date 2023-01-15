const { ApplicationCommandType } = require("discord.js");
const { ContextMenu, Categories } = require("../../src/utils");

const command = new ContextMenu({
    name: "Prompt: Dall-e",
    type: ApplicationCommandType.Message,
    category: Categories.Fun
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ephemeral: true});

    const dalle = require("../../commands/fun/dalle");
    dalle.execute(interaction, models, {
        descripcion: {
            value: params.message.content
        }
    }, client)
}

module.exports = command;