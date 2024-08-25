const { BaseInteraction, time } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class ToggledCommandError extends JeffreyBotError {
    /**
     * 
     * @param {BaseInteraction} interaction 
     * @param {{since: Date, reason: String}} toggledQuery 
     */
    constructor(interaction, toggledQuery) {
        super(interaction);

        this.name = "ToggledCommand";

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                commandName: interaction.commandName,
                since: time(toggledQuery.since),
                reason: toggledQuery.reason
            }
        })
    }
}

module.exports = ToggledCommandError;