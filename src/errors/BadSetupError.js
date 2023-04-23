const { BaseInteraction } = require("discord.js");
const JeffreyBotError = require("./JeffreyBotError");
const ErrorEmbed = require("../utils/ErrorEmbed");

class BadSetupError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     */
    constructor(interaction) {
        super(interaction);
        this.name = "BadSetup"

        this.embed = new ErrorEmbed(interaction, {
            type: this.name
        })
    }
}

module.exports = BadSetupError;