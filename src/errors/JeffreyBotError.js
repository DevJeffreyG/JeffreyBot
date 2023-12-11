const { BaseInteraction, CommandInteraction } = require("discord.js");
const ErrorEmbed = require("../utils/ErrorEmbed");

class JeffreyBotError extends Error {
    /**
     * @param {BaseInteraction | CommandInteraction} interaction 
     * @param {String | String[]} help Ayuda opcional
     * @param {String} message Resumen de lo que pasó opcional
     */
    constructor(interaction, help = "JeffreyG ya lo sabe", message = "Algo salió muy mal") {
        super(message)
        this.interaction = interaction;
        this.name = "JeffreyBotError";

        let guide = typeof help === "string" ? [help] : help;

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                message,
                guide
            }
        })

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