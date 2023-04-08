const { Command, Categories, Embed, ErrorEmbed, FindNewId, Confirmation, Shop, ItemTypes, ItemObjetives, ItemActions, BoostTypes, BoostObjetives, ItemEffects } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const ms = require("ms");

const command = new Command({
    name: "admin",
    desc: "Comandos que administran diferentes secciones dentro de un servidor",
    category: Categories.Administration
})

// https://www.youtube.com/watch?v=mABmOBBFEAo
command.data
    .addSubcommandGroup(keys =>
        keys
            .setName("keys")
            .setDescription("Administración de las llaves")
            .addSubcommand(dinerok => dinerok
                .setName("dinero")
                .setDescription("Añadir una nueva llave para canjear con recompensas de dinero")
                .addIntegerOption(option => option
                    .setName("cantidad")
                    .setDescription("Cantidad de dinero a dar")
                    .setMinValue(1)
                    .setRequired(true))
            )
            .addSubcommand(expk => expk
                .setName("exp")
                .setDescription("Añadir una nueva llave para canjear con recompensas de EXP")
                .addIntegerOption(option => option
                    .setName("cantidad")
                    .setDescription("Cantidad de EXP a dar")
                    .setMinValue(1)
                    .setRequired(true))
            )
            .addSubcommand(rolek => rolek
                .setName("role")
                .setDescription("Añadir una nueva llave para canjear con recompensa de Role")
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Role a dar")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("duracion")
                    .setDescription("Duración del role asignado: 1d, 20m, 10s, 1y"))
            )
            .addSubcommand(boostk => boostk
                .setName("boost")
                .setDescription("Añadir una nueva llave para canjear con recompensa de Boost")
                .addStringOption(option => option
                    .setName("tipo")
                    .setDescription("El tipo de boost que va a ser")
                    .addChoices(
                        { name: "Multiplicador", value: String(BoostTypes.Multiplier) },
                        { name: "Probabilidad Boost", value: String(BoostTypes.Probabilities) }
                    )
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("objetivo")
                    .setDescription("Lo que va a modificar")
                    .addChoices(
                        { name: "Dinero", value: String(BoostObjetives.Currency) },
                        { name: "EXP", value: String(BoostObjetives.Exp) },
                        { name: "Todo", value: String(BoostObjetives.All) },
                    )
                    .setRequired(true))
                .addNumberOption(option => option
                    .setName("valor")
                    .setDescription("Valor del boost")
                    .setMinValue(1.1)
                    .setRequired(true))
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Role a dar con el Boost"))
                .addStringOption(option => option
                    .setName("duracion")
                    .setDescription("Duración del Boost: 1d, 20m, 10s, 1y"))

            )
            .addSubcommand(remove => remove
                .setName("remove")
                .setDescription("Elimina una llave por su ID")
                .addIntegerOption(o => o
                    .setName("id")
                    .setDescription("La ID de la llave")
                    .setMinValue(1)
                    .setRequired(true)
                )
            )
    )
    .addSubcommandGroup(vault =>
        vault
            .setName("vault")
            .setDescription("Administración del Vault")
            .addSubcommand(add =>
                add
                    .setName("add")
                    .setDescription("Agregar un nuevo código al Vault")
                    .addStringOption(o =>
                        o
                            .setName("codigo")
                            .setDescription("El código que se escribirá para recibir la recompensa")
                            .setRequired(true)
                    )
            )
            .addSubcommand(remove =>
                remove
                    .setName("remove")
                    .setDescription("Elimina un código del Vault")
                    .addIntegerOption(o =>
                        o
                            .setName("codigo")
                            .setDescription("La ID del código a eliminar")
                            .setRequired(true)
                    )
            )
            .addSubcommand(config =>
                config
                    .setName("config")
                    .setDescription("Configura/administra algún código ya creado")
                    .addIntegerOption(o =>
                        o
                            .setName("codigo")
                            .setDescription("La ID del código a configurar")
                            .setRequired(true)
                    )
                    .addStringOption(o =>
                        o
                            .setName("pista")
                            .setDescription("Una pista nueva a agregar")
                    )
                    .addIntegerOption(o =>
                        o
                            .setName("recompensa")
                            .setDescription("La nueva cantidad de dinero a dar como recompensa")
                    )
            )
            .addSubcommand(list =>
                list
                    .setName("list")
                    .setDescription("Obtén una lista de todos los códigos dentro del servidor")
            )
    )
    .addSubcommandGroup(shop =>
        shop
            .setName("shop")
            .setDescription("Administración de la tienda del servidor")
            .addSubcommand(list =>
                list
                    .setName("list")
                    .setDescription("Lista de todos los items de la tienda, los que tienen usos y los que no.")
                    .addBooleanOption(darkshop =>
                        darkshop.setName("darkshop")
                            .setDescription("¿Lista de items para la DarkShop?")
                            .setRequired(true)
                    )
            )
            .addSubcommand(adddiscount =>
                adddiscount
                    .setName("add-discount")
                    .setDescription("Agrega un nuevo descuento para usuarios por nivel")
                    .addIntegerOption(o =>
                        o
                            .setName("nivel")
                            .setDescription("El nivel al cual se aplicará el descuento")
                            .setRequired(true)
                    )
                    .addIntegerOption(o =>
                        o
                            .setName("descuento")
                            .setDescription("El descuento aplicado (en porcentaje, ej: 10, 15, 50) [0 para eliminar]")
                            .setRequired(true)
                    )
            )
            .addSubcommand(additem =>
                additem
                    .setName("add-item")
                    .setDescription("Agregar un item a alguna de las tiendas")
                    .addBooleanOption(darkshop =>
                        darkshop.setName("darkshop")
                            .setDescription("¿El item es para la DarkShop?")
                            .setRequired(true)
                    )
                    .addStringOption(o =>
                        o.setName("nombre")
                            .setDescription("El nombre del item")
                            .setRequired(true))
                    .addStringOption(o =>
                        o.setName("descripcion")
                            .setDescription("La descripción del item")
                            .setRequired(true))
                    .addIntegerOption(o =>
                        o.setName("precio")
                            .setDescription("El precio base del item")
                            .setRequired(true))
            )
            .addSubcommand(delitem =>
                delitem
                    .setName("del-item")
                    .setDescription("Eliminar un item de alguna de las tiendas")
                    .addBooleanOption(darkshop =>
                        darkshop.setName("darkshop")
                            .setDescription("¿El item es para la DarkShop?")
                            .setRequired(true)
                    )
                    .addIntegerOption(o =>
                        o.setName("id")
                            .setDescription("La ID del item para eliminar")
                            .setRequired(true)
                    )
            )
    )
    .addSubcommandGroup(items =>
        items
            .setName("items")
            .setDescription("Administración de los items de las tiendas del servidor")
            .addSubcommand(useinfo =>
                useinfo
                    .setName("use-info")
                    .setDescription("Editar el uso que tiene un item de la tienda. [DS] = DarkShop")
                    .addBooleanOption(darkshop =>
                        darkshop.setName("darkshop")
                            .setDescription("¿El item es de la DarkShop?")
                            .setRequired(true)
                    )
                    .addIntegerOption(option =>
                        option.setName("id")
                            .setDescription("La id del item a editar")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("accion")
                            .setDescription("¿Se agrega o elimina el 'objetivo'?")
                            .addChoices(
                                { name: "Agrega", value: String(ItemActions.Add) },
                                { name: "Elimina", value: String(ItemActions.Remove) }
                            )
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("objetivo")
                            .setDescription("El objetivo al usar el item: ¿a qué se hará la accion?")
                            .addChoices(
                                { name: "Role", value: String(ItemObjetives.Role) },
                                { name: "Warns", value: String(ItemObjetives.Warns) },
                                { name: "Item", value: String(ItemObjetives.Item) },
                                { name: "Boost", value: String(ItemObjetives.Boost) },
                            )
                            .setRequired(true))
                    .addRoleOption(option =>
                        option.setName("role")
                            .setDescription("¿Qué role se agrega/elimina?"))
                    .addStringOption(option =>
                        option.setName("boostobj")
                            .setDescription("El objetivo del boost (si es un boost)")
                            .addChoices(
                                { name: "Dinero", value: String(BoostObjetives.Currency) },
                                { name: "EXP", value: String(BoostObjetives.Exp) },
                                { name: "Todo", value: String(BoostObjetives.All) },
                            )
                    )
                    .addStringOption(option =>
                        option.setName("boosttype")
                            .setDescription("El tipo del boost (si es un boost)")
                            .addChoices(
                                { name: "Multiplicador", value: String(BoostTypes.Multiplier) },
                                { name: "Probabilidad Boost", value: String(BoostTypes.Probabilities) }
                            )
                    )
                    .addNumberOption(option => option
                        .setName("boostval")
                        .setDescription("Valor del boost (si es un boost)")
                        .setMinValue(0.01)
                    )
                    .addIntegerOption(option =>
                        option.setName("cantidad")
                            .setDescription("¿Cuántos 'items' se agregarán al inventario?"))
                    .addStringOption(option =>
                        option.setName("reply")
                            .setDescription("Mensaje que se envía después de usar el item. No llenar esto para dejar el actual"))
                    .addStringOption(option =>
                        option.setName("duracion")
                            .setDescription("Si es un tipo role o boost, ¿cuánto dura? 1d, 7d, 10m, etc"))
                    .addStringOption(o =>
                        o.setName("especial")
                            .setDescription("Si es algún item especial, el tipo que es.")
                            .addChoices(
                                { name: "Firewall [DS]", value: String(ItemTypes.Firewall) },
                                { name: "~(+5%) Precisión (Stack Overflow) [DS]", value: String(ItemTypes.StackOverflow) },
                                { name: "Reset Interest [DS]", value: String(ItemTypes.ResetInterest) },
                                { name: "Skip Firewall [DS]", value: String(ItemTypes.SkipFirewall) }
                            )
                    )
                    .addStringOption(option =>
                        option.setName("efecto")
                            .setDescription("Si el efecto es positivo o negativo al usarse [DS]")
                            .addChoices(
                                { name: "Positivo", value: String(ItemEffects.Positive) },
                                { name: "Negativo", value: String(ItemEffects.Negative) }
                            )
                    )
            )
            .addSubcommand(toggle =>
                toggle
                    .setName("toggle")
                    .setDescription("Ocultar un item de la tienda")
                    .addBooleanOption(darkshop =>
                        darkshop.setName("darkshop")
                            .setDescription("¿El item es de la DarkShop?")
                            .setRequired(true)
                    )
                    .addIntegerOption(option =>
                        option.setName("id")
                            .setDescription("La id del item a alternar")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("duracion")
                            .setDescription("¿Cuánto tiempo estará oculto? - 1d, 1h, 10m, 30s, etc."))
            )
            .addSubcommand(name =>
                name
                    .setName("name")
                    .setDescription("Edita el nombre de un item")
                    .addBooleanOption(darkshop =>
                        darkshop.setName("darkshop")
                            .setDescription("¿El item es de la DarkShop?")
                            .setRequired(true)
                    )
                    .addIntegerOption(option =>
                        option.setName("id")
                            .setDescription("La id del item a editar")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("nombre")
                            .setDescription("El nuevo nombre del item")
                            .setRequired(true))
            )
            .addSubcommand(desc =>
                desc
                    .setName("desc")
                    .setDescription("Edita la descripción de un item")
                    .addBooleanOption(darkshop =>
                        darkshop.setName("darkshop")
                            .setDescription("¿El item es de la DarkShop?")
                            .setRequired(true)
                    )
                    .addIntegerOption(option =>
                        option.setName("id")
                            .setDescription("La id del item a editar")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("descripcion")
                            .setDescription("La nueva descripción del item")
                            .setRequired(true))
            )
            .addSubcommand(price =>
                price
                    .setName("price")
                    .setDescription("Edita el precio de un item")
                    .addBooleanOption(darkshop =>
                        darkshop.setName("darkshop")
                            .setDescription("¿El item es de la DarkShop?")
                            .setRequired(true)
                    )
                    .addIntegerOption(option =>
                        option.setName("id")
                            .setDescription("La id del item a editar")
                            .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName("precio")
                            .setDescription("El nuevo precio del item")
                            .setMinValue(1)
                            .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName("interes")
                            .setDescription("El costo que debería agregarse después de comprar este item. (0 para desactivar)")
                            .setMinValue(0))
            )
    )

command.addEach({ filter: "keys", type: "integer", name: "usos", desc: "Los usos máximos permitidos en el servidor para esta llave", min: 1 });

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    switch (params.subgroup) {
        case "temp":
            await command.tempExec(interaction, models, params);
            break;

        case "keys":
            await command.keysExec(interaction, models, params);
            break;

        case "vault":
            await command.vaultExec(interaction, models, params, client)
            break;

        case "shop":
            await command.shopExec(interaction, models, params, client)
            break;

        case "items":
            await command.itemsExec(interaction, models, params, client)
            break;
    }
}

command.keysExec = async (interaction, models, params) => {
    const { Guilds } = models;
    const { subcommand, keys } = params;
    const { role, tipo, cantidad, objetivo, valor, duracion, usos, id } = keys;

    // generar nueva key
    const generatedID = FindNewId(await Guilds.find(), "data.keys", "id");
    const doc = params.getDoc();

    // code
    let generatedCode = generateCode()
    while (await findKey(doc, generatedCode)) {
        generatedCode = generateCode();
    }

    switch (subcommand) {
        case "dinero":
        case "exp":
            if (subcommand === "dinero") type = ItemObjetives.Currency;
            if (subcommand === "exp") type = ItemObjetives.Exp;

            doc.data.keys.push({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    value: cantidad.value
                },
                code: generatedCode,
                id: generatedID
            });

            await doc.save();
            break;

        case "role":
        case "boost":
            let boost_type = null;
            let boost_value = null;
            let boost_objetive = null;

            if (subcommand === "boost") {
                type = ItemObjetives.Boost;
                boost_type = tipo.value;
                boost_value = valor.value;
                boost_objetive = objetivo.value;
            } else {
                type = ItemObjetives.Role
            }

            doc.data.keys.push({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    boost_type,
                    boost_value,
                    boost_objetive,
                    value: role?.value ?? 0,
                    duration: duracion ? ms(duracion.value) : Infinity
                },
                code: generatedCode,
                id: generatedID
            })

            await doc.save();
            break;

        case "remove":
            let i = doc.data.keys.findIndex(x => x.id === id.value);

            if (i === -1) {
                let e = new ErrorEmbed(interaction, {
                    type: "doesntExist",
                    data: {
                        action: "remove key",
                        missing: `La llave con ID \`${id.value}\``,
                        context: "este servidor"
                    }
                })

                return e.send();
            } else

                doc.data.keys.splice(i, 1)
            await doc.save();

            return interaction.editReply({ embeds: [new Embed({ type: "success", data: { desc: "Se ha eliminado la llave" } })] });
    }

    let added = new Embed({ type: "success" })
        .defDesc(`**—** Se ha generado una nueva llave.
**—** \`${generatedCode}\`.
**—** ID: \`${generatedID}\`.`)

    return interaction.editReply({ embeds: [added] });
}

command.vaultExec = async (interaction, models, params, client) => {
    const { Guilds } = models;
    const { subcommand, vault } = params;
    const { codigo, pista, recompensa } = vault;
    const { Currency } = client.getCustomEmojis(interaction.guild.id)

    const doc = params.getDoc();

    switch (subcommand) {
        case "add": {
            const id = FindNewId(await Guilds.find(), "data.vault_codes", "id");
            const code = codigo.value.toUpperCase();

            let exists = new ErrorEmbed(interaction, {
                type: "alreadyExists",
                data: {
                    action: "add code",
                    existing: code,
                    context: "el Vault de este servidor"
                }
            })
            if (doc.getVaultCode(code)) return exists.send();

            doc.data.vault_codes.push({
                code,
                id
            });
            await doc.save();

            let e = new Embed({
                type: "success",
                data: {
                    //separator: "**—**",
                    title: "Nuevos textos",
                    desc: [
                        `Código: \`${code}\``,
                        `Recompensa: **${Currency}100**`,
                        `ID de Código: \`${id}\``
                    ]
                }
            })
            return interaction.editReply({ content: null, embeds: [e] })
        }

        case "remove": {
            const id = codigo.value;
            const vaultCode = doc.getVaultCodeById(id);

            let notexists = new ErrorEmbed(interaction, {
                type: "doesntExist",
                data: {
                    action: "remove code",
                    missing: `El código con ID \`${id}\``,
                    context: "el Vault de este servidor"
                }
            })
            if (!vaultCode) return notexists.send();

            let confirm = [
                `Código con ID \`${vaultCode.id}\` : "**${vaultCode.code}**".`,
                `Tiene \`${vaultCode.hints.length}\` pistas adjuntas.`,
                `Da de recompensa **${Currency}${vaultCode.reward.toLocaleString("es-CO")}**`,
                `Esto no se puede deshacer.`
            ]

            let confirmation = await Confirmation("Eliminar código", confirm, interaction)
            if (!confirmation) return;

            let index = doc.data.vault_codes.indexOf(vaultCode);
            doc.data.vault_codes.splice(index, 1);
            await doc.save();

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: "Se ha eliminado el código del Vault"
                        }
                    })
                ], components: []
            });
        }

        case "config": {
            const vaultCode = doc.getVaultCodeById(codigo.value);

            if (!pista && !recompensa) { // config del codigo actual
                let e = new Embed()
                    .defAuthor({ text: `Configuración de ${vaultCode.code}`, title: true })
                    .defDesc(`**—** Recompensa de **${Currency}${vaultCode.reward.toLocaleString("es-CO")}**
**—** Tiene \`${vaultCode.hints.length}\` pistas en total.
**—** ID: \`${vaultCode.id}\`.`)
                    .defColor(Colores.verde);

                return interaction.editReply({ embeds: [e] })
            }

            if (pista) {
                const hint = pista.value;

                let toConfirm = [
                    `¿Deseas agregar la pista N°${vaultCode.hints.length + 1}?`,
                    `\`${hint}\`.`,
                    `Para el código "${vaultCode.code}" con ID \`${vaultCode.id}\``
                ]

                let confirmation = await Confirmation("Nueva pista", toConfirm, interaction);
                if (!confirmation) return;

                vaultCode.hints.push(hint);
            }

            if (recompensa) {
                const reward = recompensa.value;

                vaultCode.reward = reward;
            }

            await doc.save();

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: "Se ha actualizado el código"
                        }
                    })
                ]
            })
        }

        case "list": {
            // TODO: Mostrar la lista de todos los códigos
            return interaction.editReply({ content: "Vuelve más tarde, esto será añadido en una actualización futura." })
        }
    }
}

command.shopExec = async (interaction, models, params, client) => {
    const { Shops, DarkShops } = models;
    const { subcommand, shop } = params;
    const { nivel, descuento, darkshop, id } = shop;

    const isDarkShop = darkshop?.value;

    const doc = isDarkShop ? await DarkShops.getOrNull(interaction.guild.id) : await Shops.getOrCreate(interaction.guild.id);
    const _shop = new Shop(doc, interaction, isDarkShop);

    switch (subcommand) {
        case "list":
            return _shop.showAllItems();

        case "add-discount":
            return _shop.addDiscount(nivel.value, descuento.value);

        case "add-item":
            return _shop.addItem(shop);

        case "del-item":
            let confirmation = await Confirmation("Eliminar item", [
                `El item con Id \`${id.value}\` de la ${isDarkShop ? "DarkShop" : "tienda"}.`,
                `Se eliminará el item de todos los inventarios.`,
                `No se devolverá dinero.`
            ], interaction)

            if (!confirmation) return;
            return _shop.removeItem(id.value);
    }
}

command.itemsExec = async (interaction, models, params, client) => {
    const { Shops, DarkShops } = models;
    const { subcommand, items } = params;
    const { darkshop, id, duracion } = items;

    const isDarkShop = darkshop.value;

    const doc = isDarkShop ? await DarkShops.getOrNull(interaction.guild.id) : await Shops.getOrCreate(interaction.guild.id);
    const _shop = new Shop(doc, interaction, isDarkShop);

    switch (subcommand) {
        case "use-info":
            return _shop.editUse(items)

        case "toggle":
            return _shop.toggleItem(id.value, duracion?.value);

        case "name":
        case "desc":
        case "price":
            return _shop.editItem(items, subcommand)
    }

}

function generateCode() {
    // generar nueva key
    let chr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let generatedCode = "";

    for (let i = 0; i < 19; i++) {
        // ABCD-EFGH-IJKL-MNOP
        // 0123 5678 9101112 14151617
        if (generatedCode.length === 4 || generatedCode.length === 9 || generatedCode.length === 14) generatedCode += "-"
        else {
            generatedCode += chr.charAt(Math.floor(Math.random() * chr.length));
        }
    }

    return generatedCode;
}

async function findKey(doc, key) {
    let q = doc.data.keys.find(x => x.code === key)

    return q ? true : false;
}

module.exports = command;