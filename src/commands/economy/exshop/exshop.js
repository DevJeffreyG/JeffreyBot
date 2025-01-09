const { Command, Shop, ShopTypes, ItemTypes, Enum } = require("../../../utils");

const command = new Command({
    name: "exshop",
    desc: "Visita la tienda externa",
    helpdesc: "Una tienda que interactúa con la vida real"
})

command.addOption({
    type: "integer",
    name: "mostrar",
    desc: "Mostrar solamente los items que sean...",
    choices: new Enum(ItemTypes).complexArray({ filterFn: (x) => { return x.toUpperCase().includes("EX") } })
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { mostrar } = params;

    const shop = await new Shop(interaction)
        .setType(ShopTypes.EXShop)
        .filter(mostrar ? (x) => { return x.use_info.item_info.type === mostrar.value } : null)
        .build(params.getDoc(), params.getUser());

    return await shop.show(5)
}

module.exports = command;