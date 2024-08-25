const { Command, ShopTypes, Shop } = require("../../utils")

const command = new Command({
    name: "buy",
    desc: "Compra items de la tienda"
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

    const shop = await new Shop(interaction)
        .setType(ShopTypes.Shop)
        .build(params.getDoc(), params.getUser());

    return await shop.buy(id.value, user?.user);
}

module.exports = command;