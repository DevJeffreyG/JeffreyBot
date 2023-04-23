const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class BadCommandError extends JeffreyBotError {
    /**
     * 
     * @param {BaseInteraction} interaction 
     * @param {String} error El Error que se mostrará en el Embed
     */
    constructor(interaction, errorMsg) {
        super(interaction)
        this.name = "BadCommand"
        
        let error = new JeffreyBotError(interaction, errorMsg)

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                commandName: interaction,
                error,
                guildId: interaction.guildId
            }
        })

        console.error(error.stack)
    }
}

module.exports = BadCommandError;