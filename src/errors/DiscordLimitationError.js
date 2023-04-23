const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class DiscordLimitationError extends JeffreyBotError {
    /**
     * 
     * @param {BaseInteraction} interaction 
     * @param {String} action Qué no se puede hacer por Discord
     * @param {String | String[]} guide Lo que se tiene que hacer entonces
     */
    constructor(interaction, action, guide) {
        super(interaction);
        this.name = "DiscordLimitation";

        let help = typeof guide === "string" ? [guide] : guide;

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                action,
                help
            }
        })
    }
}

module.exports = DiscordLimitationError;