const { AlreadyUsingError } = require("../../../errors");
const { Command, Shop, ShopTypes, Enum, ItemTypes } = require("../../../utils")
const command = new Command({
    name: "petshop",
    desc: "Visita la tienda de mascotas"
})

command.addOption({
    type: "integer",
    name: "mostrar",
    desc: "Mostrar solamente los items que sean...",
    choices: new Enum(ItemTypes).complexArray({ filterFn: (x) => { return x.toUpperCase().includes("PET") } })
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { mostrar } = params;

    if (client.petCombats.get(interaction.user.id)) throw new AlreadyUsingError(interaction, `Como ${interaction.user.toString()} estaba en combate, no pudo ir a la tienda`);

    const shop = await new Shop(interaction)
        .setType(ShopTypes.PetShop)
        .filter(mostrar ? (x) => { return x.use_info.item_info.type === mostrar.value } : null)
        .build(params.getDoc(), params.getUser());

    return await shop.show(5);
}

module.exports = command;