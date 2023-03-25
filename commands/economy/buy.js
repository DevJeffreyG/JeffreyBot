const { Command, Categories, Shop } = require("../../src/utils")

const command = new Command({
    name: "buy",
    desc: "Compra items de la tienda",
    category: Categories.Economy
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "ID del item a comprar",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Shops } = models
    const { id } = params

    // codigo
    const doc = await Shops.getOrCreate(interaction.guild.id);
    const shop = new Shop(doc, interaction);

    return shop.buy(id.value)
}

module.exports = command;