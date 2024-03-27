const { BaseInteraction } = require("discord.js");
const JeffreyBotError = require("./JeffreyBotError");
const ErrorEmbed = require("../utils/ErrorEmbed");

class BadSetupError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     * @param {String[]} guide Exactamente qué está mal configurado
     */
    constructor(interaction, guide) {
        super(interaction);
        this.name = "BadSetup"

        guide = typeof guide === "string" ? [guide] : guide;

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                guide
            }
        })
    }
}

module.exports = BadSetupError;