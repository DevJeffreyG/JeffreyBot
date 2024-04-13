const { Colores } = require("../../src/resources");
const { Command, Cooldowns, Enum, InteractivePages, ModifierType, RequirementType, Shop, RouletteItem, Multipliers, ShopTypes } = require("../../src/utils");

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

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const user = params.getUser();
    const doc = params.getDoc();
    const { RouletteItems } = models;
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
                author_icon: interaction.user.avatarURL({ dynamic: true }),
                color: Colores.verde,
                addon: `**— {name}**\n▸ {mention}\n▸ Eso es en **{exact}**.\n\n`,
                footer_icon: interaction.guild.iconURL({ dynamic: true })
            }, items, 5)

            await interactive.init(interaction)
            break;
        }

        case "modificadores": {
            let items = new Map();

            for (modifier of doc.settings.modifiers) {
                const tipo = new Enum(ModifierType).translate(modifier.type);
                const valor = (modifier.multiplier).toLocaleString("es-CO");
                const req = modifier.requirement;
                const req_type = new Enum(RequirementType).translate(modifier.req_type);
                const objetive = new Enum(modifier.type === ModifierType.Cooldown ? Cooldowns : Multipliers).translate(modifier.module)
                const id = modifier.id;
                const guide = modifier.type === ModifierType.Cooldown ? "La base se __multiplica__ por" : "A la base se le __suma__"
                const requirement = modifier.req_type === RequirementType.Level ? req : interaction.guild.roles.cache.find(x => x.id === req);

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
                author_icon: interaction.guild.iconURL({ dynamic: true }),
                color: Colores.verde,
                addon: `**— {tipo}**\n**▸ {guide}: {valor}**\n**▸ Modifica: {objetive}**\n**▸ Necesita ({req_type}):** \`{requirement}\`\n||**▸ ID: {id}**||\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }

        case "descuentos": {
            const shop = await new Shop(interaction)
                .setType(params[subcommand].tipo.value)
                .build(doc, user);

            let items = new Map();

            for (discount of shop.shopdoc.discounts) {
                items.set(discount.id, {
                    level: discount.level.toLocaleString("es-CO"),
                    discount: discount.discount,
                    id: discount.id
                })
            }

            const interactive = new InteractivePages({
                title: `Lista de descuentos (${new Enum(ShopTypes).translate(shop.config.info.type)})`,
                author_icon: interaction.guild.iconURL({ dynamic: true }),
                color: Colores.verde,
                addon: `**— ID: {id}**\n**▸ Nivel:** {level}\n**▸ Descuento:** {discount}%\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }

        case "roulette": {
            let items = new Map();
            let roulleteItems = await RouletteItems.getAll();

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
                author_icon: client.user.displayAvatarURL({ dynamic: true }),
                color: Colores.verde,
                addon: `**▸** {text}\n**▸** Probabilidad del **{prop}%** para que se detenga.\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }
    }
}

module.exports = command;