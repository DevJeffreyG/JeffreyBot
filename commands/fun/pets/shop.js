const { Command, Shop, ShopTypes } = require("../../../src/utils")
const command = new Command({
    name: "petshop",
    desc: "Visita la tienda de mascotas"
})

command.execute = async(interaction, models, params, client) => {
    await interaction.deferReply();

    const shop = await new Shop(interaction)
    .setType(ShopTypes.PetShop)
    .build(params.getDoc(), params.getUser());

    return await shop.show();
}

module.exports = command;