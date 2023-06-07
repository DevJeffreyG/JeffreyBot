const { time } = require("discord.js")
const { Command, Categories, Embed, ShopTypes, Enum, Store } = require("../../src/utils")
const { Colores } = require("../../src/resources");
const { FetchError } = require("../../src/errors");

const command = new Command({
    name: "inventory",
    desc: "Te muestra los items actualmente en tu inventario"
})

command.addOption({
    type: "integer",
    name: "tipo",
    desc: "¿Qué inventario quieres ver?",
    choices: new Enum(ShopTypes).complexArray()
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { tipo } = params;

    const type = tipo?.value ?? ShopTypes.Shop;

    // codigo
    const user = params.getUser();
    const store = await new Store(interaction)
        .setType(type)
        .build(params.getDoc(), params.getUser());

    let itemsEmbed = new Embed()
        .defAuthor({ text: `Tu inventario (${store.config.info.name})`, icon: interaction.member.displayAvatarURL() })
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .defFooter({ text: `/use ID para usar un item.` })
        .defColor(store.config.info.color);

    for (const item of user.data.inventory) {
        const real_item = store.shop.items.find(x => x.id === item.item_id);
        if (!real_item) continue;

        const f = item.shopType === type && real_item.use_info.action !== null && !real_item.disabled;
        if (f) itemsEmbed.defField(`— ${real_item.name}`, `**▸ Activo**: ${item.active ? `Sí, desde ${time(item.active_since)}` : "No"}.\n**▸ ID**: \`${item.use_id}\`.`)
    }

    if (!itemsEmbed.data.fields)
        throw new FetchError(interaction, "items", ["No hay items en tu inventario para mostrar", `Compra items usando ${client.mentionCommand("buy")}`]);

    return interaction.editReply({ embeds: [itemsEmbed] });
}

module.exports = command;