const { Command, Categories, Embed, DarkShop } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "inflacion",
    desc: "Te muestra la inflación actual de los DarkJeffros",
    category: Categories.DarkShop
})

command.execute = async (interaction, models, params, client) => {
    const darkshop = new DarkShop(interaction.guild, interaction)
    darkshop.inflationEmbed();
}

module.exports = command;