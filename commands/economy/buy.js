const { Command, Categories, Shop } = require("../../src/utils")

const command = new Command({
    name: "buy",
    desc: "Compra items de la tienda",
    category: Categories.Economy
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
    const { Shops } = models
    const { id, user } = params

    // codigo
    const doc = await Shops.getOrCreate(interaction.guild.id);
    const shop = new Shop(doc, interaction);

    return await shop.buy(id.value, user?.user);
}

module.exports = command;