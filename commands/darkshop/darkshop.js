const { Command, Categories, Store, ShopTypes } = require("../../src/utils");

const command = new Command({
    name: "darkshop",
    desc: "Visita la DarkShop",
    helpdesc: "La otra cara de la moneda te aguarda, visita la DarkShop",
    category: Categories.DarkShop
})

command.addOption({
    type: "integer",
    name: "pag",
    desc: "Ir a una página inicial definida"
});

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const ds = await new Store(interaction)
        .setType(ShopTypes.DarkShop)
        .build(params.getDoc(), params.getUser());

    return ds.show({ pag: params.pag?.value })
}

module.exports = command;