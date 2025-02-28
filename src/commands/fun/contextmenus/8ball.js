const { ApplicationCommandType, MessageFlags } = require("discord.js");
const { ContextMenu } = require("../../../utils");

const command = new ContextMenu({
    name: "Pregúntale a la 8ball",
    type: ApplicationCommandType.Message
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    params["pregunta"] = {
        value: params.message.content
    }

    const generate = require("../../commands/fun/8ball");
    await generate.execute(interaction, models, params, client)
}

module.exports = command;