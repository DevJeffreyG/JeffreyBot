const { Command, Shop, ShopTypes } = require("../../../utils");

const command = new Command({
    name: "darkshop",
    desc: "Visita la DarkShop",
    helpdesc: "La otra cara de la moneda te aguarda, visita la DarkShop"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const ds = await new Shop(interaction)
        .setType(ShopTypes.DarkShop)
        .build(params.getDoc(), params.getUser());

    return await ds.show()
}

module.exports = command;