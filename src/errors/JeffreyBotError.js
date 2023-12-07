const { BaseInteraction, CommandInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");

class JeffreyBotError extends Error {
    /**
     * @param {BaseInteraction | CommandInteraction} interaction 
     */
    constructor(interaction, message) {
        super(message)
        this.interaction = interaction;
        this.name = "JeffreyBotError";
        this.embed = new ErrorEmbed(interaction).defDesc("Algo salió muy mal");
        this.ephemeral = false;
        this.followup = false;
    }

    async send(options) {
        try {
            let op = options ?? { ephemeral: this.ephemeral, followup: this.followup }
            if (!op) {
                if (!this.interaction.replied) op.ephemeral = true;
                else {
                    if (this.interaction.ephemeral) op.followup = true;
                    else op.ephemeral = this.interaction.ephemeral;
                }
            }

            await this.embed.send(options);
        } catch (error) {
            console.log(err)
        }
    }

    message() {
        return this.embed?.data.description ?? "ERR";
    }

    /**
     * @param {Boolean} b Es ephemeral?
     */
    setEphemeral(b) {
        this.ephemeral = b;
        return this;
    }

    /**
     * 
     * @param {Boolean} b Es followUp?
    */
    setFollowUp(b) {
        this.followup = b;
        return this;
    }
}

module.exports = JeffreyBotError;