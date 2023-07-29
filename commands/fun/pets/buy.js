const { AlreadyUsingError } = require("../../../src/errors");
const { Command, Shop, ShopTypes } = require("../../../src/utils");

const command = new Command({
    name: "petbuy",
    desc: "Compra items de la tienda de mascotas"
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
    const { id, user } = params

    let userCheck = user?.user ?? interaction.user;
    if (client.petCombats.get(userCheck.id)) throw new AlreadyUsingError(interaction, `Como ${userCheck.toString()} estaba en combate, no pudo hacerse`);
    const shop = await new Shop(interaction)
        .setType(ShopTypes.PetShop)
        .build(params.getDoc(), params.getUser());

    return await shop.buy(id.value, user?.user);
}

module.exports = command;