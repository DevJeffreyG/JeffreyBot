const { Command, Categories, Embed, ErrorEmbed, WillBenefit, LimitedTime, FindNewId, Confirmation, Shop, ItemTypes, ItemObjetives, ItemActions, BoostTypes, BoostObjetives } = require("../../src/utils")
const { Config, Colores, Emojis } = require("../../src/resources")

const ms = require("ms");

const command = new Command({
    name: "admin",
    desc: "Comandos que administran diferentes secciones dentro de un servidor",
    category: Categories.Administration
})

// https://www.youtube.com/watch?v=mABmOBBFEAo
command.data
    .addSubcommandGroup(temp =>
        temp
            .setName("temp")
            .setDescription("Role o boost temporales...?")
            .addSubcommand(sub => sub
                .setName("role")
                .setDescription("Agrega un role temporal a un usuario")
                .addUserOption(option => option
                    .setName("usuario")
                    .setDescription("El usuario al que se le agregará el rol")
                    .setRequired(true))
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("El role a agregar")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("tiempo")
                    .setDescription("El tiempo que tiene que pasar para eliminar el role: 1d, 20m, 10s, 1y...")
                    .setRequired(true))
            )
            .addSubcommand(sub => sub
                .setName("boost")
                .setDescription("Agrega un boost a un usuario")
                .addUserOption(option => option
                    .setName("usuario")
                    .setDescription("El usuario al que se le agregará el rol")
                    .setRequired(true))
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("El role a agregar con el boost")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("tipo")
                    .setDescription("El tipo de boost")
                    .addChoices(
                        { name: "Multiplicador", value: "boostMultiplier" },
                        { name: "Probabilidad Boost", value: "boostProbabilities" }
                    )
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName("objetivo")
                    .setDescription("Lo que va a modificar")
                    .addChoices(
                        { name: "Jeffros", value: "jeffros" },
                        { name: "EXP", value: "exp" },
                        { name: "Todo", value: "all" },
                    )
                    .setRequired(true))
                .addNumberOption(option => option
                    .setName("valor")
                    .setDescription("Valor del boost")
                    .setMinValue(1.1)
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("tiempo")
                    .setDescription("El tiempo que tiene que pasar para eliminar el boost: 1d, 20m, 10s, 1y...")
                    .setRequired(true))
            )
    )
    .addSubcommandGroup(add =>
        add
            .setName("add")
            .setDescription("Añadir...")
            .addSubcommand(jeffrosk => jeffrosk
                .setName("jeffroskey")
                .setDescription("Añadir una nueva llave para canjear con recompensas de Jeffros")
                .addIntegerOption(option => option
                    .setName("cantidad")
                    .setDescription("Cantidad de Jeffros a dar")
                    .setMinValue(1)
                    .setRequired(true))
            )
            .addSubcommand(expk => expk
                .setName("expkey")
                .setDescription("Añadir una nueva llave para canjear con recompensas de Jeffros")
                .addIntegerOption(option => option
                    .setName("cantidad")
                    .setDescription("Cantidad de EXP a dar")
                    .setMinValue(1)
                    .setRequired(true))
            )
            .addSubcommand(rolek => rolek
                .setName("rolekey")
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
                .setName("boostkey")
                .setDescription("Añadir una nueva llave para canjear con recompensa de Boost")
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Role a dar")
                    .setRequired(true))
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
                        { name: "Jeffros", value: String(BoostObjetives.Jeffros) },
                        { name: "EXP", value: String(BoostObjetives.Exp) },
                        { name: "Todo", value: String(BoostObjetives.All) },
                    )
                    .setRequired(true))
                .addNumberOption(option => option
                    .setName("valor")
                    .setDescription("Valor del boost")
                    .setMinValue(1.1)
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("duracion")
                    .setDescription("Duración del role asignado: 1d, 20m, 10s, 1y"))

            )
    )
    .addSubcommandGroup(user =>
        user
            .setName("user")
            .setDescription("Administración de tipo usuarios")
            .addSubcommand(sub => sub
                .setName("dm")
                .setDescription("Enviar un mensaje directo al usuario como STAFF")
                .addUserOption(option => option
                    .setName("usuario")
                    .setDescription("Usuario al que se le va a enviar el mensaje")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("mensaje")
                    .setDescription("Mensaje a enviar. Usa {yo} para poner tu nombre, {user} para poner el tag de 'usuario'")
                    .setRequired(true))
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
                            .setDescription("La nueva cantidad de Jeffros a dar como recompensa")
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
                            .setDescription("El descuento aplicado (en porcentaje, ej: 10, 15, 50)")
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
                    .setDescription("Eliminar un item a alguna de las tiendas")
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
                    .setDescription("Editar el uso que tiene un item de la tienda")
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
                    .addIntegerOption(option =>
                        option.setName("cantidad")
                            .setDescription("¿Cuántos 'items' se agregarán al inventario?"))
                    .addStringOption(option =>
                        option.setName("reply")
                            .setDescription("Mensaje que se envía después de usar el item. No llenar esto para dejar el actual"))
                    .addStringOption(o =>
                        o.setName("especial")
                            .setDescription("Si es algún item especial, el tipo que es. [DS] = DarkShop")
                            .addChoices(
                                { name: "Firewall [DS]", value: String(ItemTypes.Firewall) },
                                { name: "Stack Overflow [DS]", value: String(ItemTypes.StackOverflow) },
                                { name: "Reset Interest [DS]", value: String(ItemTypes.ResetInterest) },
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
            )
    )

command.addEach({ filter: "add", type: "integer", name: "usos", desc: "Los usos máximos permitidos en global para esta key", min: 1 });

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    switch (params.subgroup) {
        case "temp":
            await command.tempExec(interaction, models, params);
            break;

        case "add":
            await command.addExec(interaction, models, params);
            break;

        case "user":
            await command.userExec(interaction, params);
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

command.tempExec = async (interaction, models, params) => {
    const { Users } = models;
    const { subcommand, temp } = params
    const { usuario, role, tiempo, tipo, objetivo, valor } = temp;

    const duration = ms(tiempo.value) || Infinity;

    let user = await Users.getOrCreate({ user_id: usuario.value, guild_id: interaction.guild.id });

    switch (subcommand) {
        case "role":
            // llamar la funcion para hacer globaldata
            await LimitedTime(usuario.member, role.role.id, duration);
            return interaction.editReply({ content: `✅ Agregado el temp role a ${usuario.user.tag} por ${tiempo.value}` });

        case "boost":
            let btype = tipo.value;
            let bobj = objetivo.value;
            let multi = valor.value;

            let toConfirm = [
                `**${usuario.user.tag}** será BENEFICIADO AÚN MÁS si aplica este boost`,
                `¿Estás segur@ de proseguir aún así?`
            ];

            const willBenefit = await WillBenefit(usuario.member)
            let confirmation = true;

            if (willBenefit) {
                confirmation = await Confirmation("Continuar", toConfirm, interaction);
            }

            if (!confirmation) return;

            // llamar la funcion para hacer un globaldata y dar el role con boost
            await LimitedTime(usuario.member, role.role.id, duration, btype, bobj, multi);
            return interaction.editReply({ content: `✅ Agregado el boost a ${usuario.user.tag} por ${tiempo.value}`, embeds: [] });
    }
}

command.addExec = async (interaction, models, params) => {
    const { Keys } = models;
    const { subcommand, add } = params;
    const { role, tipo, cantidad, objetivo, valor, duracion, usos } = add;

    // generar nueva key
    let keysq = await Keys.find();
    const generatedID = await FindNewId(keysq, "", "id");

    // code
    let generatedCode = generateCode()
    while (await findKey(generatedCode)) {
        generatedCode = generateCode();
    }

    switch (subcommand) {
        case "jeffroskey":
        case "expkey":
            if (subcommand === "jeffroskey") type = "jeffros";
            if (subcommand === "expkey") type = "exp";

            await new Keys({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    value: cantidad.value
                },
                code: generatedCode,
                id: generatedID
            }).save();
            break;

        case "rolekey":
        case "boostkey":
            let boost_type = null;
            let boost_value = null;
            let boost_objetive = null;

            if (subcommand === "boostkey") {
                type = "boost";
                boost_type = tipo.value;
                boost_value = valor.value;
                boost_objetive = objetivo.value;
            } else {
                type = "role"
            }

            await new Keys({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    boost_type,
                    boost_value,
                    boost_objetive,
                    value: role.value,
                    duration: duracion ? ms(duracion.value) : Infinity
                },
                code: generatedCode,
                id: generatedID
            }).save();

    }

    let added = new Embed()
        .defAuthor({ text: `Listo: ${subcommand}`, icon: Config.bienPng })
        .defDesc(`**—** Se ha generado una nueva llave.
**—** \`${generatedCode}\`.
**—** ID: \`${generatedID}\`.`)
        .setColor(Colores.verde)

    return interaction.editReply({ embeds: [added] });
}

command.userExec = async (interaction, params) => {
    const { subcommand, user } = params;
    const { usuario, mensaje } = user;

    switch (subcommand) {
        case "dm":
            if (usuario.user.bot) return interaction.editReply({ content: "No le voy a enviar un mensaje a un bot, perdona." })

            let yoStr = mensaje.value.replace(new RegExp('{yo}', "g"), `**${interaction.user.tag}**`);
            let final = yoStr.replace(new RegExp('{user}', "g"), `**${usuario.user.tag}**`)

            let embed = new Embed()
                .defAuthor({ text: "Hola:", icon: "https://i.pinimg.com/originals/85/7f/d7/857fd79dfd7bd025e4cbb2169cd46e03.png" })
                .defDesc(final)
                .defFooter({ text: "Este es un mensaje directamente del staff del servidor." })
                .defColor(Colores.verde);

            try {
                await usuario.member.send({ embeds: [embed] })
                interaction.editReply({
                    content: null, embeds: [
                        new Embed({
                            type: "success",
                            data: {
                                desc: `Se envió el mensaje por privado`
                            }
                        })
                    ]
                })
            } catch (e) {
                interaction.editReply({ embeds: [new ErrorEmbed({ type: "notSent", data: { tag: usuario.user.tag, error: e } })] })
            }
            break;
    }
}

command.announceExec = async (interaction, params, client) => {
    const { subcommand, announce } = params;
    const { titulo, anuncio, imagen } = announce;

    switch (subcommand) {
        case "jbnews":
            let jbNRole = client.user.id === Config.testingJBID ? interaction.guild.roles.cache.find(x => x.id === '790393911519870986') : guild.roles.cache.find(x => x.id === Config.jbnews);
            let ch = client.user.id === Config.testingJBID ? interaction.guild.channels.cache.find(x => x.id === "483007967239602196") : message.guild.channels.cache.find(x => x.id === Config.announceChannel);

            if (!anuncio && !imagen) return interaction.editReply({ embeds: [new ErrorEmbed({ type: "badParams", data: { help: "Si no hay 'anuncio' debe haber una imagen." } })] });
            if (titulo) title = titulo.value;
            else title = "¡Novedades de Jeffrey Bot!"

            let embed = new Embed()
                .defColor(Colores.verde)
                .defFooter({ text: `Noticia por ${interaction.user.tag}`, icon: client.user.displayAvatarURL(), timestamp: true })

            if (imagen) embed.setImage(imagen.attachment.url);
            if (anuncio) embed.defDesc(anuncio.value)
            else embed.defDesc(" ")

            if (!anuncio && embed.image) {
                embed.defAuthor({ text: title, icon: guild.iconURL() })
            } else if (anuncio && imagen) {
                embed.defAuthor({ text: title, title: true });
                embed.defThumbnail(client.user.displayAvatarURL());
            } else {
                embed.defAuthor({ text: title, title: true });
            }

            let toConfirm = [
                "El anuncio se verá como lo ves aquí:",
                embed
            ]
            let confirmation = await Confirmation("Enviar anuncio", toConfirm, interaction)
            if (!confirmation) return;

            ch.send({ content: `${jbNRole}`, embeds: [embed] });
            return confirmation.editReply({ content: `✅ Anuncio enviado a ${ch}!`, embeds: [] });
    }
}

command.vaultExec = async (interaction, models, params, client) => {
    const { Guilds } = models;
    const { subcommand, vault } = params;
    const { codigo, pista, recompensa } = vault;

    const doc = await Guilds.getOrCreate(interaction.guild.id)

    console.log(params, codigo)

    switch (subcommand) {
        case "add": {
            const id = await FindNewId(await Guilds.find(), "data.vault_codes", "id");
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
                        `Recompensa: **${Emojis.Jeffros}100**`,
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
                `Da de recompensa **${Emojis.Jeffros}${vaultCode.reward.toLocaleString("es-CO")}**`,
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
                    .defDesc(`**—** Recompensa de **${Emojis.Jeffros}${vaultCode.reward.toLocaleString("es-CO")}**
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
    }
}

command.shopExec = async (interaction, models, params, client) => {
    const { Shops, DarkShops } = models;
    const { subcommand, shop } = params;
    const { nivel, descuento, darkshop, id } = shop;

    const isDarkShop = darkshop.value;

    const doc = isDarkShop ? await DarkShops.getOrCreate(interaction.guild.id) : await Shops.getOrCreate(interaction.guild.id);
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
                `No se devolverá ningún Jeffro.`
            ], interaction)

            if(!confirmation) return;
            return _shop.removeItem(id.value);
    }
}

command.itemsExec = async (interaction, models, params, client) => {
    const { Shops, DarkShops } = models;
    const { subcommand, items } = params;
    const { darkshop, id, duracion } = items;

    const isDarkShop = darkshop.value;

    const doc = isDarkShop ? await DarkShops.getOrCreate(interaction.guild.id) : await Shops.getOrCreate(interaction.guild.id);
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
        if (generatedCode.length == 4 || generatedCode.length == 9 || generatedCode.length == 14) generatedCode += "-"
        else {
            generatedCode += chr.charAt(Math.floor(Math.random() * chr.length));
        }
    }

    return generatedCode;
}

async function findKey(key) {
    const { Keys } = require("mongoose").models;
    let q = await Keys.findOne({
        code: key
    });

    return q ? true : false;
}

module.exports = command;