const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class CommandNotFoundError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction La interacción que disparó este error
     * @param {String} commandName El nombre del comando que no se encontró
     */
    constructor(interaction, commandName = null) {
        super(interaction);

        this.name = "CommandNotFound";

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: commandName ?? interaction.commandName
        })
    }
}

module.exports = CommandNotFoundError;