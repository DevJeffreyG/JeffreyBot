const { BaseInteraction, GuildMember } = require("discord.js");
const JeffreyBotError = require("./JeffreyBotError");
const ErrorEmbed = require("../utils/ErrorEmbed");

class DMNotSentError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     * @param {GuildMember} member
     * @param {String} error El error que arrojó al intentar enviar el mensaje
     */
    constructor(interaction, member, error) {
        super(interaction)
        this.name = "DMNotSent";
        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                tag: member.user.tag,
                error
            }
        })
    }
}

module.exports = DMNotSentError;