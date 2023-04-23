const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class DoesntExistsError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     * @param {String} missing Lo que no existe
     * @param {String} context El contexto donde ya existe
     * @example 
     * ```js
     * throw new DoesntExistsError(interaction, "El usuario con id 2", "la base de datos");
     * // [El usuario con id 2] no existe en [la base de datos].
     * ```
     */
    constructor(interaction, missing, context) {
        super(interaction)
        this.name = "DoesntExists";
        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                commandName: interaction.commandName ?? interaction.customId ?? "execute",
                missing,
                context
            }
        })
    }
}

module.exports = DoesntExistsError;