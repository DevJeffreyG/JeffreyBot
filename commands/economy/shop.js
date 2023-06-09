const { Command, Categories, Store, ShopTypes } = require("../../src/utils")

const command = new Command({
    name: "shop",
    desc: "Visita la tienda del servidor"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const shop = await new Store(interaction)
        .setType(ShopTypes.Shop)
        .build(params.getDoc(), params.getUser());

    return shop.show()
}

module.exports = command;