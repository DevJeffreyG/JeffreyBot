const { time, inlineCode } = require("discord.js")
const { Command, ShopTypes, Enum, Shop, InteractivePages, HumanMs, PrettyCurrency } = require("../../src/utils");

const command = new Command({
    name: "inventario",
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
    const shop = await new Shop(interaction)
        .setType(type)
        .build(params.getDoc(), params.getUser());

    let items = new Map();

    for (const inv_item of user.data.inventory) {
        const shop_item = shop.shopdoc.items.find(x => x.id === inv_item.item_id);
        if (!shop_item) continue;

        const isSub = shop.shopdoc.isSub(shop_item);
        const f = inv_item.shopType === type && shop_item.use_info.action !== null && !shop_item.disabled;
        if (f) {
            let count = 1;
            let useId = inlineCode(inv_item.use_id);
            let old = items.get(shop_item.id);

            if (old) {
                count += old.count;
                useId = old.useId + `, ${useId}`
            }

            items.set(shop_item.id, {
                name: shop_item.name,
                count,
                desc: shop_item.description,
                active: inv_item.active ? `Sí, desde ${time(inv_item.active_since)}` : "No",
                useId,
                sub_info: isSub ?
                `**▸ Es una suscripción,** ${PrettyCurrency(interaction.guild, shop_item.price)} **cada ${new HumanMs(shop_item.use_info.item_info?.duration).human}**.\n` : ""
            })
        }
    }

    const interactive = new InteractivePages({
        title: `Tu inventario (${shop.config.info.name})`,
        author_icon: interaction.member.displayAvatarURL(),
        footer_icon: interaction.guild.iconURL({ dynamic: true }),
        description: `### — Usa ${client.mentionCommand("use")} para usar un item.\n— Tienes...`,
        color: shop.config.info.color,
        addon: `**— ({count}) {name}**
> ℹ️ {desc}
{sub_info}**▸ Activo**: {active}.
**▸ ID**: {useId}.\n\n`
    }, items, 3);

    return await interactive.init(interaction)
}

module.exports = command;