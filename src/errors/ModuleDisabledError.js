const ErrorEmbed = require("../utils/ErrorEmbed");
const JeffreyBotError = require("./JeffreyBotError");

class ModuleDisabledError extends JeffreyBotError {
    constructor(interaction) {
        super(interaction);

        this.name = "ModuleDisabled"
        this.embed = new ErrorEmbed(interaction, {
            type: this.name
        })
    }
}

module.exports = ModuleDisabledError;