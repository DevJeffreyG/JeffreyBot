const { Command, Shop, ShopTypes } = require("../../../utils");

const command = new Command({
    name: "exshop",
    desc: "Visita la tienda externa",
    helpdesc: "Una tienda que interactúa con la vida real"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const shop = await new Shop(interaction)
        .setType(ShopTypes.EXShop)
        .build(params.getDoc(), params.getUser());

    return await shop.show()
}

module.exports = command;