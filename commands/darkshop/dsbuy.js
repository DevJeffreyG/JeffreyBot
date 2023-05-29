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

command.addOption({
    type: "user",
    name: "user",
    desc: "El usuario al que le vas a comprar este item"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { DarkShops } = models
    const { id, user } = params

    // codigo
    const doc = await DarkShops.getWork(interaction.guild.id);
    const shop = new Shop(doc, interaction, true);

    return shop.buy(id.value, user?.user)
}

module.exports = command;