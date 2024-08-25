const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class AlreadyUsingError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     * @param {String} guide ¿Qué está siendo usado?
     */
    constructor(interaction, guide) {
        super(interaction)
        this.name = "AlreadyUsing"

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                guide
            }
        })
    }
}

module.exports = AlreadyUsingError;