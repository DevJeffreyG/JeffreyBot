const { Colores } = require("../../src/resources");
const { Command, Categories, Cooldowns, Enum, InteractivePages, ModifierType, RequirementType, Shop, RouletteItem } = require("../../src/utils");

const command = new Command({
    name: "lists",
    desc: "Obtén listas útiles de cosas dentro del servidor",
    category: Categories.General
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
    const { Shops, RouletteItems } = models;
    const { subcommand } = params;

    switch (subcommand) {
        case "cooldowns": {
            let items = new Map();

            for (cooldownType of new Enum(Cooldowns).complexArray()) {
                let info = await user.cooldown(cooldownType.value, { save: false })

                if (info) items.set(cooldownType.name, {
                    mention: info.mention,
                    name: cooldownType.name,
                    exact: info.text
                })
            }

            const interactive = new InteractivePages({
                title: `Cooldowns de ${interaction.user.tag}`,
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
                const id = modifier.id;
                const guide = modifier.type === ModifierType.Cooldown ? "La base se __multiplica__ por" : "A la base se le __suma__"
                const requirement = modifier.req_type === RequirementType.Level ? req : interaction.guild.roles.cache.find(x => x.id === req);

                items.set(id, {
                    tipo,
                    valor,
                    requirement,
                    req_type,
                    guide,
                    id
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de modidificadores",
                author_icon: interaction.guild.iconURL({ dynamic: true }),
                color: Colores.verde,
                addon: `**— {tipo}**\n**▸ {guide}: {valor}**\n**▸ Necesita ({req_type}):** \`{requirement}\`\n||**▸ ID: {id}**||\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }

        case "descuentos": {
            let items = new Map();
            let shop = await Shops.getOrCreate(interaction.guild.id)

            for (discount of shop.discounts) {
                items.set(discount.id, {
                    level: discount.level.toLocaleString("es-CO"),
                    discount: discount.discount,
                    id: discount.id
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de descuentos",
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

            for(const item of roulleteItems) {
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
                addon: `**▸** {text}\n**▸** Probabilidad del **{prop}%** para que salga\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }
    }
}

module.exports = command;