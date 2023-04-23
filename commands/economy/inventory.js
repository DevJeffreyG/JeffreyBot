const { time } = require("discord.js")
const { Command, Categories, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources");
const { FetchError } = require("../../src/errors");

const command = new Command({
    name: "inventory",
    desc: "Te muestra los items actualmente en tu inventario",
    category: Categories.Economy
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Shops, DarkShops } = models
    const { darkshop } = params;

    const { EmojisObject } = client;

    const isDarkShop = darkshop?.value ?? false;

    // codigo
    const user = params.getUser();

    const shop = isDarkShop ?
        await DarkShops.getOrNull(interaction.guild.id) :
        await Shops.getOrCreate(interaction.guild.id);

    let itemsEmbed = new Embed()
        .defAuthor({ text: `Tu inventario`, icon: interaction.member.displayAvatarURL() })
        .setThumbnail(isDarkShop ? EmojisObject.DarkShop.url : interaction.guild.iconURL({ dynamic: true }))
        .defFooter({ text: `/use ID para usar un item.` })
        .setColor(isDarkShop ? Colores.negro : Colores.verde);

    user.data.inventory.forEach(item => {
        const real_item = shop.items.length > 0 ? shop.items.find(x => x.id === item.item_id) : null;
        const f = real_item && item.isDarkShop === isDarkShop && (real_item.use_info.action !== null && !real_item.disabled)
        if (f) itemsEmbed.defField(`— ${real_item.name}`, `**▸ Activo**: ${item.active ? `Sí, desde ${time(item.active_since)}` : "No"}.\n**▸ ID**: \`${item.use_id}\`.`)
    });

    if (user.data.inventory.filter(x => x.isDarkShop === isDarkShop).length === 0 || !itemsEmbed.data.fields) 
        throw new FetchError(interaction, "items", ["No hay items en tu inventario para mostrar", `Compra items usando ${client.mentionCommand("buy")}`]);

    return interaction.editReply({ embeds: [itemsEmbed] });
}

module.exports = command;