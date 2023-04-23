const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class InsuficientSetupError extends JeffreyBotError {
    /**
     * 
     * @param {BaseInteraction} interaction 
     * @param {String} needed Lo que hace falta
     * @param {String | String[]} help Una guia de qué se tiene que configurar antes
     */
    constructor(interaction, needed, help = null) {
        super(interaction)

        this.name = "InsuficientSetup";

        let guide = typeof help === "string" ? [help] : help ?? null;

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                needed,
                guide
            }
        })
    }
}

module.exports = InsuficientSetupError;