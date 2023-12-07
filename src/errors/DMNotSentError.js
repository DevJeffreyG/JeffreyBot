const { BaseInteraction, GuildMember, GuildChannel } = require("discord.js");
const JeffreyBotError = require("./JeffreyBotError");
const ErrorEmbed = require("../utils/ErrorEmbed");

class DMNotSentError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     * @param {GuildMember} member
     * @param {String[] | String} error El error que arrojó al intentar enviar el mensaje
     */
    constructor(interaction, member, error) {
        super(interaction)
        this.name = "DMNotSent";

        error = typeof error === "string" ? [error] : error;

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                tag: member.user.username,
                error
            }
        }, true)
    }
}

module.exports = DMNotSentError;