const { SlashCommandIntegerOption } = require("discord.js");
const { Command, Shop, Confirmation, ShopTypes, Enum, ItemActions, ItemObjetives, ItemEffects, BoostTypes, BoostObjetives } = require("../../../utils");

const command = new Command({
    name: "admin-shop",
    desc: "Administración de las tiendas"
})

command.data
    .addSubcommand(itemlist =>
        itemlist
            .setName("item-list")
            .setDescription("Lista de todos los items de la tienda, los que tienen usos y los que no.")
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
    )
    .addSubcommand(useinfo =>
        useinfo
            .setName("use-info")
            .setDescription("Editar el uso que tiene un item de la tienda. [DS] = DarkShop")
            .addIntegerOption(option =>
                option
                    .setName("accion")
                    .setDescription("¿Se agrega o elimina el 'objetivo'?")
                    .addChoices(...new Enum(ItemActions).complexArray())
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName("objetivo")
                    .setDescription("El objetivo al usar el item: ¿a qué se hará la accion?")
                    .addChoices(...new Enum(ItemObjetives).complexArray().slice(0, 4))
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option
                    .setName("uso-manual")
                    .setDescription("¿tiene que activarlo usando el comando /use?")
            )
            .addRoleOption(option =>
                option
                    .setName("role")
                    .setDescription("¿Qué role se agrega/elimina?")
            )
            .addIntegerOption(option =>
                option
                    .setName("boostobj")
                    .setDescription("El objetivo del boost (si es un boost)")
                    .addChoices(...new Enum(BoostObjetives).complexArray())
            )
            .addIntegerOption(option =>
                option
                    .setName("boosttype")
                    .setDescription("El tipo del boost (si es un boost)")
                    .addChoices(...new Enum(BoostTypes).complexArray())
            )
            .addNumberOption(option => option
                .setName("boostval")
                .setDescription("Valor del boost (si es un boost)")
                .setMinValue(0.01)
            )
            .addIntegerOption(option =>
                option
                    .setName("cantidad")
                    .setDescription("¿Cuántos 'objetivos' se agregarán/eliminarán?")
                    .setMinValue(1)
            )
            .addStringOption(option =>
                option
                    .setName("reply")
                    .setDescription("Mensaje que se envía después de usar el item. No llenar esto para dejar el actual")
            )
            .addStringOption(option =>
                option
                    .setName("duracion")
                    .setDescription("Si es una SUB, ¿cada cuánto paga? Si es un tipo role o boost, ¿cuánto dura? 1d, 7d, 10m, etc")
            )
            .addBooleanOption(o =>
                o
                    .setName("especial")
                    .setDescription("Si es algún item especial.")
            )
            .addBooleanOption(o =>
                o
                    .setName("sub")
                    .setDescription("Si es una suscripción.")
            )
            .addIntegerOption(option =>
                option
                    .setName("efecto")
                    .setDescription("Si el efecto es positivo o negativo al usarse [DS]")
                    .addChoices(...new Enum(ItemEffects).complexArray())
            )
    )
    .addSubcommand(toggle =>
        toggle
            .setName("toggle")
            .setDescription("Ocultar un item de la tienda")
            .addStringOption(option =>
                option.setName("duracion")
                    .setDescription("¿Cuánto tiempo estará oculto? - 1d, 1h, 10m, 30s, etc."))
    )
    .addSubcommand(edit =>
        edit
            .setName("edit")
            .setDescription("Edita un item creado")
    )
    .addSubcommand(req =>
        req
            .setName("req-info")
            .setDescription("Define los requisitos de un item para poder comprarlo/usarlo")
            .addRoleOption(option =>
                option
                    .setName("role")
                    .setDescription("Un rol requerido. @everyone para eliminarlo.")
            )
            .addIntegerOption(option =>
                option
                    .setName("trofeo")
                    .setDescription("La ID de un Trofeo requerido. 0 para eliminario.")
                    .setMinValue(0)
            ).addIntegerOption(option =>
                option
                    .setName("nivel")
                    .setDescription("El nivel requerido (>=). 0 para eliminario.")
                    .setMinValue(0)
            )
    )

command.addOptionsTo(["edit", "toggle", "use-info", "del-item", "req-info"], [
    new SlashCommandIntegerOption()
        .setName("id")
        .setDescription("La ID del item")
        .setRequired(true)
], true)

command.addOptionsTo(["item-list", "add-discount", "add-item", "del-item", "use-info", "toggle", "edit", "req-info"], [
    new SlashCommandIntegerOption()
        .setName("tipo")
        .setDescription("El tipo de tienda de este item")
        .setChoices(...new Enum(ShopTypes).complexArray())
        .setRequired(true)
])

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { subcommand } = params;
    const { nivel, descuento, id, tipo, duracion } = params[subcommand];

    const shop = await new Shop(interaction)
        .setType(tipo.value)
        .build(params.getDoc(), params.getUser());

    switch (subcommand) {
        case "item-list":
            return await shop.showAllItems();

        case "add-discount":
            return await shop.addDiscount(nivel.value, descuento.value);

        case "add-item":
            return await shop.addItem(params[subcommand]);

        case "del-item":
            let confirmation = await Confirmation("Eliminar item", [
                `El item con Id \`${id.value}\` de la tienda.`,
                `Se eliminará el item de todos los inventarios.`,
                `No se devolverá dinero.`
            ], interaction)

            if (!confirmation) return;
            return await shop.removeItem(id.value);
        case "use-info":
            return await shop.editUse(params[subcommand])

        case "req-info":
            return await shop.required(params[subcommand]);

        case "toggle":
            return await shop.toggleItem(id.value, duracion?.value);

        case "edit":
            return await shop.editItem(params[subcommand])
    }
}

module.exports = command;