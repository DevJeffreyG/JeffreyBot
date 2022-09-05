const { Command, Categories, Shop } = require("../../src/utils")

const command = new Command({
    name: "shop",
    desc: "Visita la tienda del servidor",
    category: Categories.Economy
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users, Shops } = models

    // codigo
    const doc = await Shops.getOrCreate(interaction.guild.id);
    const shop = new Shop(doc, interaction);

    return shop.setup();
}

module.exports = command;