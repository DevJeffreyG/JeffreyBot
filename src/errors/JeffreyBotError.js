const { BaseInteraction, CommandInteraction, MessageFlags } = require("discord.js");
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
            let op = options ?? { flags: [...(this.ephemeral ? [MessageFlags.Ephemeral] : [])], followup: this.followup }
            if (!op) {
                if (!this.interaction.replied) op.flags.push(MessageFlags.Ephemeral);
                else {
                    if (this.interaction.ephemeral) {
                        op.flags.push(MessageFlags.Ephemeral);
                        op.followup = true;
                    }
                }
            }

            await this.embed.send(op);
        } catch (error) {
            console.error("🔴 %s", err);
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