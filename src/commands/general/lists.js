const { time, MessageFlags } = require("discord.js");
const { Colores } = require("../../resources");
const { Command, Cooldowns, Enum, InteractivePages, ModifierType, RequirementType, Shop, RouletteItem, Multipliers, ShopTypes, PrettyCurrency } = require("../../utils");

const command = new Command({
    name: "lists",
    desc: "Obtén listas útiles de cosas dentro del servidor"
})

command.data
    .addSubcommand(sub =>
        sub
            .setName("cooldowns")
            .setDescription("Lista de todos tus Cooldowns en este servidor")
    )
    .addSubcommand(sub =>
        sub
            .setName("modificadores")
            .setDescription("Lista de los modificadores en este servidor")
    )
    .addSubcommand(sub =>
        sub
            .setName("descuentos")
            .setDescription("Lista de los descuentos en las tiendas en este servidor")
            .addIntegerOption(tipo =>
                tipo
                    .setName("tipo")
                    .setDescription("El tipo de tienda para obtener sus descuentos")
                    .setChoices(...new Enum(ShopTypes).complexArray())
                    .setRequired(true)
            )
    )
    .addSubcommand(sub =>
        sub
            .setName("roulette")
            .setDescription("Lista de todos los items de la Ruleta")
    )
    .addSubcommand(sub =>
        sub
            .setName("deudas")
            .setDescription("Lista de todas las deudas que tienes")
    )
    .addSubcommand(sub =>
        sub
            .setName("prestamos")
            .setDescription("Lista de todas los préstamos que tienes")
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const user = params.getUser();
    const doc = params.getDoc();
    const { RouletteItems, Users } = models;
    const { subcommand } = params;

    switch (subcommand) {
        case "cooldowns": {
            let items = new Map();

            for (cooldownType of new Enum(Cooldowns).complexArray({ valueString: true })) {
                let info = await user.cooldown(cooldownType.value, { save: false })

                if (info) items.set(cooldownType.name, {
                    mention: info.mention,
                    name: cooldownType.name,
                    exact: info.text
                })
            }

            const interactive = new InteractivePages({
                title: `Tus Cooldowns`,
                author_icon: interaction.user.avatarURL(),
                color: Colores.verde,
                addon: `**— {name}**\n▸ {mention}\n▸ Eso es en **{exact}**.\n\n`,
                footer_icon: interaction.guild.iconURL()
            }, items, 5)

            await interactive.init(interaction)
            break;
        }

        case "modificadores": {
            let items = new Map();
            let modifiers = doc.settings.modifiers;
            modifiers.sort((a, b) => b.multiplier - a.multiplier);

            for (const modifier of modifiers) {
                const tipo = new Enum(ModifierType).translate(modifier.type);
                const valor = (modifier.multiplier).toLocaleString("es-CO");
                const req = modifier.requirement;
                const req_type = new Enum(RequirementType).translate(modifier.req_type);
                const objetive = new Enum(modifier.type === ModifierType.Cooldown ? Cooldowns : Multipliers).translate(modifier.module)
                const id = modifier.id;
                const guide = modifier.type === ModifierType.Cooldown ? "La base se __multiplica__ por" : "A la base se le __suma__"
                const requirement = modifier.req_type === RequirementType.Level ? `\`${req}\`` : interaction.guild.roles.cache.find(x => x.id === req);

                items.set(id, {
                    tipo,
                    valor,
                    requirement,
                    objetive,
                    req_type,
                    guide,
                    id
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de modidificadores",
                author_icon: interaction.guild.iconURL(),
                color: Colores.verde,
                addon: `**— {tipo}**\n**▸ {guide}: {valor}**\n**▸ Modifica: {objetive}**\n**▸ Necesita ({req_type}):** {requirement}\n||**▸ ID: {id}**||\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }

        case "descuentos": {
            const shop = await new Shop(interaction)
                .setType(params[subcommand].tipo.value)
                .build(doc, user);

            let items = new Map();
            let discounts = shop.shopdoc.discounts;
            discounts.sort((a, b) => b.discount - a.discount);

            for (const discount of discounts) {
                items.set(discount.id, {
                    level: discount.level.toLocaleString("es-CO"),
                    discount: discount.discount,
                    id: discount.id
                })
            }

            const interactive = new InteractivePages({
                title: `Lista de descuentos (${new Enum(ShopTypes).translate(shop.config.info.type)})`,
                author_icon: interaction.guild.iconURL(),
                color: Colores.verde,
                addon: `**— ID: {id}**\n**▸ Nivel:** {level}\n**▸ Descuento:** {discount}%\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }

        case "roulette": {
            let items = new Map();
            let roulleteItems = await RouletteItems.getAll();
            roulleteItems.sort((a, b) => b.prob - a.prob);

            for (const item of roulleteItems) {
                const itemObj = new RouletteItem(interaction, item).build(user, doc).info();
                items.set(item.id, {
                    text: itemObj.text,
                    prop: itemObj.likelihood.toLocaleString("es-CO"),
                    id: item.id
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de Items de la Ruleta",
                author_icon: client.user.displayAvatarURL(),
                color: Colores.verde,
                addon: `**▸** {text}\n**▸** Probabilidad del **{prop}%** para que se detenga.\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }

        case "deudas": {
            let items = new Map();
            let debts = user.data.debts;
            debts.sort((a, b) => b.debt - a.debt);

            for (const debt of debts) {
                items.set(debt.id, {
                    member: interaction.guild.members.cache.get(debt.user),
                    debt: PrettyCurrency(interaction.guild, debt.debt),
                    paying: PrettyCurrency(interaction.guild, Math.round(loan.debt * loan.interest / 100)),
                    interest: debt.interest,
                    next: time(debt.pay_in, "R"),
                    since: time(debt.since, "F")
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de deudas que tienes",
                author_icon: interaction.member.displayAvatarURL(),
                color: Colores.verde,
                addon: `**▸** {debt} a **{interest}%** ({paying}).\n**▸** Con {member} desde {since}.\n**▸** Pago de intereses {next}.\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }

        case "prestamos": {
            let items = new Map();
            let usersWithLoan = await Users.find({
                guild_id: interaction.guild.id,
                "data.debts": {
                    $all: [
                        { "$elemMatch": { user: interaction.user.id } },
                    ]
                }
            });

            for (const user of usersWithLoan) {
                const loan = user.data.debts.find(x => x.user === interaction.user.id)
                items.set(loan.id, {
                    member: interaction.guild.members.cache.get(user.user_id),
                    debt: PrettyCurrency(interaction.guild, loan.debt),
                    paying: PrettyCurrency(interaction.guild, Math.round(loan.debt * loan.interest / 100)),
                    interest: loan.interest,
                    next: time(loan.pay_in, "R"),
                    since: time(loan.since, "T")
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de préstamos que tienes",
                footer: `Puedes cancelar un préstamo usando /perdonar - Página {ACTUAL} de {TOTAL}`,
                author_icon: interaction.member.displayAvatarURL(),
                color: Colores.verde,
                addon: `**▸** {debt} a **{interest}%** ({paying}).\n**▸** Con {member} desde {since}.\n**▸** Pago de intereses {next}.\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }
    }
}

module.exports = command;