const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class FetchError extends JeffreyBotError {
    /**
     * 
     * @param {BaseInteraction} interaction 
     * @param {String} where De qué no se pudo obtener información
     * @param {String | String[]} help Explicación de por qué es un problema
     */
    constructor(interaction, where, help) {
        super(interaction)
        this.name = "FetchError"

        let guide = typeof help === "string" ? [help] : help;
        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                type: where, 
                guide
            }
        })
    }
}

module.exports = FetchError;