const { ApplicationCommandType } = require("discord.js");
const { ContextMenu } = require("../../../src/utils");

const command = new ContextMenu({
    name: "Generar imágenes",
    type: ApplicationCommandType.Message
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    params["descripcion"] = {
        value: params.message.content
    }

    const generate = require("../../commands/fun/generate");
    await generate.execute(interaction, models, params, client)

    interaction.followUp({ ephemeral: true, content: `La entrada tomada del mensaje fue \`${params.message.content}\`.` })
}

module.exports = command;