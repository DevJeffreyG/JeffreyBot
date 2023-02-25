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
    await dalle.execute(interaction, models, {
        descripcion: {
            value: params.message.content
        }
    }, client)

    console.log("ping!")

    interaction.followUp({ephemeral: true, content: `La entrada tomada del mensaje fue \`${params.message.content}\`.`})
}

module.exports = command;