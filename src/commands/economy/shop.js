const { Command, Shop, ShopTypes } = require("../../utils")

const command = new Command({
    name: "shop",
    desc: "Visita la tienda del servidor"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const shop = await new Shop(interaction)
        .setType(ShopTypes.Shop)
        .build(params.getDoc(), params.getUser());

    return await shop.show()
}

module.exports = command;