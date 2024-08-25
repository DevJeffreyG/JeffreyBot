const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class ExecutionError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     * @param {String | String[]} help Explicación de lo que pasó y porqué es un problema
     */
    constructor(interaction, help) {
        super(interaction);
        this.name = "ExecutionError"

        let guide = typeof help === "string" ? [help] : help;

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                command: interaction.commandName ?? interaction.customId?.split("-")[0] ?? interaction.customId,
                guide
            }
        })
    }
}

module.exports = ExecutionError;