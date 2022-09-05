const { Command, Categories, Shop } = require("../../src/utils");

const command = new Command({
    name: "dscalc",
    desc: "Determina automáticamente cuantos Jeffros tienes actualmente",
    category: Categories.DarkShop
})

command.addOption({
    type: "integer",
    name: "darkjeffros",
    desc: "¿Cuánto valen X darkjeffros ahora mismo?",
    req: false,
    min: 1
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { DarkShops } = models;

    const darkshop = await DarkShops.getOrCreate(interaction.guild.id);

}

module.exports = command;