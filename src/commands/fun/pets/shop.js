const { AlreadyUsingError } = require("../../../errors");
const { Command, Shop, ShopTypes } = require("../../../utils")
const command = new Command({
    name: "petshop",
    desc: "Visita la tienda de mascotas"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    if (client.petCombats.get(interaction.user.id)) throw new AlreadyUsingError(interaction, `Como ${interaction.user.toString()} estaba en combate, no pudo ir a la tienda`);

    const shop = await new Shop(interaction)
        .setType(ShopTypes.PetShop)
        .build(params.getDoc(), params.getUser());

    return await shop.show();
}

module.exports = command;