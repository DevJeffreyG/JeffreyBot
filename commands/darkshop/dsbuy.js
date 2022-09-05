const { Command, Categories, Shop } = require("../../src/utils")

const command = new Command({
    name: "dsbuy",
    desc: "Compra items de la DarkShop",
    category: Categories.DarkShop
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
    const { DarkShops } = models
    const { id } = params

    // codigo
    const doc = await DarkShops.getOrCreate(interaction.guild.id);
    const shop = new Shop(doc, interaction, true);

    return shop.buy(id.value)
}

module.exports = command;