const { BaseInteraction } = require("discord.js");
const JeffreyBotError = require("./JeffreyBotError");
const ErrorEmbed = require("../utils/ErrorEmbed");

class EconomyError extends JeffreyBotError {
    /**
     * @param {BaseInteraction} interaction 
     * @param {String | String[]} guide Cuál es el error de economía
     * @param {Number} money El dinero actual del usuario
     * @param {Boolean} darkshop Si es de la DarkShop o dinero normal
     */
    constructor(interaction, guide, money, darkshop = false) {
        super(interaction);
        this.name = "EconomyError";

        let error = typeof guide === "string" ? [guide] : guide;

        this.embed = new ErrorEmbed(interaction, {
            type: this.name,
            data: {
                commandName: interaction.commandName ?? interaction.customId ?? "comando",
                error,
                darkshop,
                money
            }
        })
    }
}

module.exports = EconomyError;