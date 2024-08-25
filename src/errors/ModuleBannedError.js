const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class ModuleBannedError extends JeffreyBotError {
    constructor(interaction) {
        super(interaction);

        this.name = "ModuleBanned"
        this.embed = new ErrorEmbed(interaction, {
            type: this.name
        })
    }
}

module.exports = ModuleBannedError;