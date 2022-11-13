const { Command, Shop, Categories } = require("../../src/utils");

const command = new Command({
    name: "darkshop",
    desc: "Visita la DarkShop",
    helpdesc: "La otra cara de la moneda te aguarda, visita la DarkShop",
    category: Categories.DarkShop
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { DarkShops } = models;

    const doc = await DarkShops.getOrNull(interaction.guild.id);
    const ds = new Shop(doc, interaction, true);

    return ds.setup()
}

module.exports = command;