const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class AlreadyExistsError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     * @param {String} existing Lo que ya existe
     * @param {String} context El contexto donde ya existe
     * @example 
     * ```js
     * throw new AlreadyExistsError(interaction, "El usuario con id 2", "la base de datos");
     * // [El usuario con id 2] ya existe en [la base de datos].
     * ```
     */
    constructor(interaction, existing, context) {
        super(interaction)
        this.name = "AlreadyExists"

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                commandName: interaction.commandName,
                existing,
                context
            }
        })
    }
}

module.exports = AlreadyExistsError;