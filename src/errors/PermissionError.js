const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class PermissionError extends JeffreyBotError {
    constructor(interaction) {
        super(interaction);
        this.name = "PermissionError";
        this.embed = new ErrorEmbed(interaction, {
            type: this.name
        })
    }
}

module.exports = PermissionError