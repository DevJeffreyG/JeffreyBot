const { Command, Categories, Shop } = require("../../src/utils")

const command = new Command({
    name: "shop",
    desc: "Visita la tienda del servidor",
    category: Categories.Economy
})

command.addOption({
    type: "integer",
    name: "pag",
    desc: "Ir a una página inicial definida"
});

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Shops } = models

    // codigo
    const doc = await Shops.getOrCreate(interaction.guild.id);
    const shop = new Shop(doc, interaction);

    return shop.setup({pag: params.pag?.value});
}

module.exports = command;