const { time, inlineCode, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Command, Enum, ShopTypes, Shop, InteractivePages, PrettyCurrency, HumanMs, Embed, Collector, CreateInteractionFilter } = require("../../utils");
const { FetchError } = require("../../errors");
const { Colores } = require("../../resources");

const ms = require("ms");

const command = new Command({
    name: "subs",
    desc: "Administra y visualiza todas tus suscripciones activas en este servidor"
})

command.addOption({
    type: "integer",
    name: "admin",
    desc: "La ID de una suscripción que vayas a administrar"
})

command.addOption({
    type: "integer",
    name: "tipo",
    desc: "¿Cuáles suscripciones quieres ver?",
    choices: new Enum(ShopTypes).complexArray()
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { tipo, admin } = params;

    const type = tipo?.value ?? ShopTypes.Shop;

    // codigo
    const user = params.getUser();
    const shop = await new Shop(interaction)
        .setType(type)
        .build(params.getDoc(), user);

    if (admin?.value) return await command.adminSub(interaction, models, { user, shop, subID: admin.value }, client);

    let items = new Map();

    for (const temp_role of user.data.temp_roles) {
        const shop_item = shop.shopdoc.items.find(x => x.id === temp_role.activation_info.item_id);
        if (!shop_item) continue;

        const isSub = shop.shopdoc.isSub(shop_item);
        const f = temp_role.activation_info.shop_type === type && isSub;
        if (f) {
            let id = inlineCode(temp_role.id);

            items.set(temp_role.id, {
                name: shop_item.name,
                desc: shop_item.description,
                price: PrettyCurrency(interaction.guild, temp_role.sub_info.price, { name: shop.config.currency.raw_emoji }),
                interval: new HumanMs(temp_role.sub_info.interval).human,
                active: `${time(temp_role.sub_info.active_since, "R")}`,
                next: temp_role.sub_info.isCancelled ? `(SUB Cancelada) Se eliminará: ${time(temp_role.active_until)} (${time(temp_role.active_until, "R")})` :
                    `Próximo pago: ${time(temp_role.active_until)} (${time(temp_role.active_until, "R")})`,
                id
            })
        }
    }

    const interactive = new InteractivePages({
        title: `Tus suscripciones (${shop.config.info.name})`,
        author_icon: interaction.member.displayAvatarURL(),
        footer_icon: interaction.guild.iconURL(),
        description: `### — Usa este mismo comando para administrar una sub por su ID.\n— Tienes...`,
        color: shop.config.info.color,
        addon: `**— {name}**
> ℹ️ {desc}
**▸** {price} cada **{interval}**.
**▸ {next}**
**▸ Activa desde: {active}**
**▸ ID**: {id}.\n\n`
    }, items, 3);

    return await interactive.init(interaction)
}

command.adminSub = async (interaction, models, params, client) => {
    const f = x => x.isSub && x.id === params.subID;
    const sub = params.user.data.temp_roles.find(f);
    const subIndex = params.user.data.temp_roles.findIndex(f);

    if (!sub) throw new FetchError(interaction, "subs", [
        `No existe una suscripción con la ID \`${params.subID}\` vinculada a tu cuenta.`
    ])

    let msg = await interaction.editReply({
        ephemeral: true,
        embeds: [
            new Embed()
                .defDesc(`# Administra tu suscripción a ${sub.sub_info.name}`)
                .fillDesc([`Usa el botón a continuación para hacerlo.`])
                .defColor(Colores.verde)
        ],
        components: [
            new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                        .setCustomId("toggleSub")
                        .setLabel(sub.sub_info.isCancelled ? "Reanudar suscripción" : "Cancelar suscripción")
                        .setStyle(sub.sub_info.isCancelled ? ButtonStyle.Primary : ButtonStyle.Danger)
                )
        ]
    })

    const collector = await new Collector(interaction, {
        filter: CreateInteractionFilter(interaction, msg, interaction.user),
        wait: true,
        time: ms("1m")
    }).wait(() => {
        msg.delete();
    });

    if (!collector) return;

    params.user = await params.user.lastVersion();
    params.user.data.temp_roles[subIndex].sub_info.isCancelled = !params.user.data.temp_roles[subIndex].sub_info.isCancelled;

    await params.user.save();
    await msg.delete();
    await interaction.followUp({
        ephemeral: true,
        embeds: [
            new Embed({
                type: "success", data: {
                    desc: sub.sub_info.isCancelled ? [
                        `Se reanudó la suscripción, se te seguirá cobrando periódicamente hasta que la canceles.`
                    ] : [
                        `Se eliminará automáticamente de tu cuenta si esta sigue cancelada al momento del próximo pago.`,
                        `Usa este comando otra vez para reanudarla si lo deseas.`,
                    ]
                }
            })
        ]
    })
}
module.exports = command;