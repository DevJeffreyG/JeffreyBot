const { Command, Categories, Embed, DarkShop } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "inflacion",
    desc: "Obtén la inflación actual de la DarkShop",
    category: Categories.DarkShop
})

command.execute = async (interaction, models, params, client) => {
    const darkshop = new DarkShop(interaction.guild, interaction)
    darkshop.inflationEmbed();
}

module.exports = command;