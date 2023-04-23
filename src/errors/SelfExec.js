const { BaseInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class SelfExec extends JeffreyBotError {
    /**
     * 
     * @param {BaseInteraction} interaction 
     * @param {Boolean} ephemeral 
     */
    constructor(interaction) {
        super(interaction);
        this.name = "SelfExec";
        this.setEphemeral(true);

        this.embed = new ErrorEmbed(interaction, {
            type: this.name
        })
    }
}

module.exports = SelfExec;