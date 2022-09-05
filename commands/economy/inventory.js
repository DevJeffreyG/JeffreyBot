const { Command, Categories, ErrorEmbed, Embed } = require("../../src/utils")
const { Config, Colores } = require("../../src/resources");

const command = new Command({
    name: "inventory",
    desc: "Te muestra los items actualmente en tu inventario",
    category: Categories.Economy
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users, Shops} = models
    const { darkshop } = params;

    const isDarkShop = darkshop?.value ?? false;
    
    // codigo
    const user = await Users.getOrCreate({
        user_id: interaction.user.id,
        guild_id: interaction.guild.id
    });

    const shop = await Shops.getOrCreate(interaction.guild.id);

    let noItems = new ErrorEmbed(interaction, {
        type: "errorFetch",
        data: {
            type: "items",
            guide: "No hay items en tu cuenta"
        }
    })

    let itemsEmbed = new Embed()
    .defAuthor({text: `Tu inventario`, icon: interaction.member.displayAvatarURL()})
    .setThumbnail(Config.jeffreyguildIcon)
    .defFooter({text: `/use ID para usar un item.`})
    .setColor(Colores.verde);

    user.data.inventory.forEach(item => {
        const real_item = shop.items.length > 0 ? shop.items.find(x => x.id === item.item_id) : null;
        if(real_item && item.isDarkShop === isDarkShop) itemsEmbed.defField(`— ${real_item.name}`, `**— Activo**: \`${item.active ? "sí" : "no"}\`.\n**— ID**: \`${item.use_id}\`.`)
    });

    if(user.data.inventory.filter(x => x.isDarkShop === isDarkShop).length === 0) return noItems.send();

    return interaction.editReply({embeds: [itemsEmbed]});
}

module.exports = command;