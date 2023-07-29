const { time, inlineCode } = require("discord.js")
const { Command, Embed, ShopTypes, Enum, Shop, InteractivePages } = require("../../src/utils")
const { FetchError } = require("../../src/errors");

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

    for (const item of user.data.inventory) {
        const real_item = shop.shopdoc.items.find(x => x.id === item.item_id);
        if (!real_item) continue;

        const f = item.shopType === type && real_item.use_info.action !== null && !real_item.disabled;
        if (f) {
            let count = 1;
            let useId = inlineCode(item.use_id);
            let old = items.get(real_item.id);

            if (old) {
                count += old.count;
                useId = old.useId + `, ${useId}`
            }

            items.set(real_item.id, {
                name: real_item.name,
                count,
                desc: real_item.description,
                active: item.active ? `Sí, desde ${time(item.active_since)}` : "No",
                useId
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
ℹ️ {desc}
**▸ Activo**: {active}.
**▸ ID**: {useId}.\n\n`
    }, items, 3);

    return await interactive.init(interaction)
}

module.exports = command;