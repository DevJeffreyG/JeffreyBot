const { Emoji, CommandInteraction, User, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputStyle } = require("discord.js");
const { Shops, DarkShops, PetShops, EXShops, Users } = require("mongoose").models;
const { Colores } = require("../resources");
const { ShopTypes, Enum, ItemTypes, ItemObjetives, ItemActions, YesNo } = require("./Enums");
const InteractivePages = require("./InteractivePages");
const { BadCommandError, DoesntExistsError, EconomyError, AlreadyExistsError, BadParamsError } = require("../errors");
const { Confirmation, FindNewId, PrettyCurrency } = require("./functions");
const Embed = require("./Embed");
const HumanMs = require("./HumanMs");
const Collector = require("./Collector");

const moment = require("moment-timezone");
const ms = require("ms");
const { ButtonStyle } = require("discord.js");
const { codeBlock } = require("discord.js");
const Item = require("./Item");
const Modal = require("./Modal");
const { Error } = require("mongoose");

class Shop {
    #build = false;
    #doc;
    #user;
    #isDarkShop = false;
    #interactive = {
        base: {},
        items: new Map()
    }
    #adminInteractive = {
        base: {},
        items: new Map()
    }

    #buildError;
    #noItemError;
    #Emojis;
    #updated = new Embed({
        type: "success",
        data: {
            desc: "Se ha actualizado el item"
        }
    })

    /**
     * @param {CommandInteraction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.client = this.interaction.client;

        this.#Emojis = this.client.Emojis;

        this.#buildError = new BadCommandError(this.interaction, "SHOP no se construyó");
        this.#noItemError = new DoesntExistsError(this.interaction, `El item con esa ID`, `la tienda de este servidor`);

        this.config = {
            info: {
                name: null,
                description: null,
                color: null,
                model: {
                    obj: null,
                    query: {}
                },
                type: ShopTypes.Shop
            },
            currency: {
                raw_emoji: null,
                emoji: null,
                user_path: null
            }
        }
    }

    /** ------------------ SETUP ------------------ */
    /**
     * @param {Enum} type 
     * @returns 
     */
    setType(type) {
        this.config.info.type = type;

        switch (type) {
            case ShopTypes.Shop:
                this.setCurrency("Currency")
                this.setInfo({
                    name: `Tienda de ${this.interaction.guild.name}`,
                    desc: `**—** ¡Bienvenid@ a la tienda! para comprar items usa ${this.client.mentionCommand("buy")}.`,
                    color: Colores.verdejeffrey,
                    model: Shops,
                    query: this.interaction.guild.id
                })
                break;

            case ShopTypes.DarkShop:
                this.setCurrency("DarkCurrency", "economy.dark.currency")
                this.setInfo({
                    name: `DarkShop de ${this.interaction.guild.name}`,
                    desc: `**—** Bienvenid@ a la DarkShop. Para comprar items usa ${this.client.mentionCommand("dsbuy")}.`,
                    color: Colores.negro,
                    model: DarkShops,
                    query: this.interaction.guild.id
                })
                this.#isDarkShop = true;
                break;

            case ShopTypes.PetShop:
                this.setCurrency("Currency")
                this.setInfo({
                    name: `Tienda de mascotas de ${this.interaction.guild.name}`,
                    desc: `**—** ¡Bienvenid@ a la tienda de mascotas! Para comprar items usa ${this.client.mentionCommand("petbuy")}.`,
                    color: Colores.verde,
                    model: PetShops,
                    query: this.interaction.guild.id
                })
                break;

            case ShopTypes.EXShop:
                this.setCurrency("Currency")
                this.setInfo({
                    name: `Tienda Externa de ${this.interaction.guild.name}`,
                    desc: `**—** ¡Bienvenid@ a la tienda externa! Para comprar items usa ${this.client.mentionCommand("exbuy")}.\n**—** Puedes interactuar con cosas en la vida real con estos items.`,
                    color: Colores.verde,
                    model: EXShops,
                    query: this.interaction.guild.id
                })
                break;
        }

        return this;
    }

    /**
     * @param {String} CurrencyName El nombre del Emoji que será usado para mostrar el dinero
     * @param {String} path La ruta de donde se sacará el dinero del usuario
     */
    setCurrency(CurrencyName, path) {
        const CurrencyEmoji = this.client.getCustomEmojis(this.interaction.guild.id)[CurrencyName];

        this.config.currency.raw_emoji = CurrencyName;
        this.config.currency.emoji = CurrencyEmoji;
        this.config.currency.user_path = path ?? "economy.global.currency";

        return this;
    }

    setInfo({ name, desc, color, model, query }) {
        this.config.info.name = name ?? "Tienda";
        this.config.info.description = desc ?? "Una tienda de cosas varias";
        this.config.info.color = color ?? Colores.verdejeffrey;
        this.config.info.model.obj = model;
        this.config.info.model.query = query ?? this.interaction.guild.id;

        return this;
    }

    async build(doc, user) {
        this.#build = true;
        this.#doc = doc;
        this.#user = user;

        this.shopdoc = await this.config.info.model.obj.getWork(this.config.info.model.query);
        this.average = this.#doc.data.average_currency;

        this.#interactive.base = {
            title: `${this.config.info.name}`,
            author_icon: this.interaction.guild.iconURL({ dynamic: true }),
            color: this.config.info.color,
            description: this.config.info.description + `\n**—** Tienes **${this.config.currency.emoji}${this.#user.get(this.config.currency.user_path).toLocaleString("es-CO")}**`,
            addon: `**\`{item_id}\` — {item_name}**\n▸ {item_desc}\n▸ **${this.config.currency.emoji}{item_price}**\n\n`,
            footer: `Página {ACTUAL} de {TOTAL}`,
            icon_footer: this.interaction.member.displayAvatarURL({ dynamic: true })
        }

        this.#adminInteractive.base = Object.assign({}, this.#interactive.base);

        let adminAddon = this.#adminInteractive.base.addon;
        this.#adminInteractive.base.description = `**—** [NOT READY]: Falta el uso (${this.client.mentionCommand("admin-shop use-info")})\n**—** [HIDDEN]: Item desactivado (${this.client.mentionCommand("admin-shop toggle")})\n**—** [✅]: El item es visible y usable para cualquiera.`;

        this.#adminInteractive.base.addon = adminAddon.substring(0, 2) + "{publicInfo} — ID: " + adminAddon.substring(2, adminAddon.length - 4) + `\n+ ${this.config.currency.emoji}{item_interest}** al comprarlo.\n\n`

        this.shopdoc.items.forEach((item, index) => {
            let price = this.determinePrice(this.#user, item, true);

            this.#interactive.items.set(item.id, {
                item_name: item.name,
                item_desc: item.description,
                item_price: price,
                item_id: item.id,
                showable: (item.use_info.action !== null && !item.disabled) ?? false,
                index
            })

            // Admin Mode
            let publicInfo;
            if (!item.use_info.action) publicInfo = "[NOT READY] ";
            else if (item.disabled) publicInfo = "[HIDDEN] ";
            else publicInfo = "[✅] ";

            let notmodified = this.determinePrice(this.#user, item, true, true);

            this.#adminInteractive.items.set(item.id, {
                item_name: item.name,
                item_desc: item.description,
                item_price: notmodified,
                item_interest: item.interest,
                item_id: item.id,
                publicInfo,
                index
            })
        });

        return this;
    }

    /** ------------------ MAIN ------------------ */
    /**
     * Mostrar la tienda con un Embed
     */
    async show() {
        if (!this.#build) throw this.#buildError;

        const interactive = new InteractivePages(this.#interactive.base, this.#interactive.items, 3)

        try {
            await interactive.init(this.interaction);
        } catch (err) {
            console.log(err);
        }
    }

    /**
     * (ADMIN) Mostrar todos los items de la tienda
     * @returns 
     */
    async showAllItems() {
        if (!this.#build) throw this.#buildError;
        const interactive = new InteractivePages(this.#adminInteractive.base, this.#adminInteractive.items, 3)

        try {
            await interactive.init(this.interaction);
        } catch (err) {
            console.log(err);
        }
    }
    /**
     * 
     * @param {Number} itemId La ID del Item a comprar
     * @param {User} user El usuario que va a recibir el item
     * @returns {Promise<CommandInteraction>}
     */
    async buy(itemId, user) {
        if (user?.id === this.interaction.user.id) user = null;
        if (!this.#build) throw this.#buildError;

        const inventoryUser = user ? await Users.getWork({
            user_id: user.id,
            guild_id: this.interaction.guild.id
        }) : this.#user;

        const member = this.interaction.member;

        const item = this.shopdoc.findItem(itemId);

        if (!item) throw this.#noItemError;

        const itemPrice = this.determinePrice(this.#user, item, true);
        const itemName = item.name;

        let toConfirm = [
            `¿Deseas comprar el item \`${itemName}\`${user ? ` a ${user}` : ""}?`,
            `Pagarás **${this.config.currency.emoji}${itemPrice}**.`,
            `Esta compra no se puede devolver.`
        ]

        if (item.interest > 0) toConfirm.push(`Al comprar el item, su precio subirá **${this.config.currency.emoji}${item.interest.toLocaleString("es-CO")}**`)

        let confirmation = await Confirmation("Comprar item", toConfirm, this.interaction);
        if (!confirmation) return;

        let price = this.determinePrice(this.#user, item);

        // role requerido
        if (item.req_role && !member.roles.cache.get(item.req_role))
            throw new DoesntExistsError(this.interaction, `<@&${item.req_role}>`, "tu usuario")

        if (!this.#user.affords(price, this.config.currency.user_path))
            throw new EconomyError(
                this.interaction,
                `No tienes tantos ${this.config.currency.emoji.name}`,
                this.#user.get(this.config.currency.user_path),
                this.#isDarkShop
            )
        if (inventoryUser.hasItem(itemId, this.config.info.type) && !item.canHaveMany)
            throw new AlreadyExistsError(this.interaction, itemName, "el inventario");

        const newUseId = FindNewId(await Users.find(), "data.inventory", "use_id");

        // revisar si debe agregarse interés
        if (item.interest > 0) {
            const interestFilter = x => x.shopType === this.config.info.type && x.item_id === item.id;
            if (!this.#user.data.purchases.find(interestFilter)) this.#user.data.purchases.push({ shopType: this.config.info.type, item_id: item.id, quantity: 1 });
            else {
                this.#user.data.purchases.find(interestFilter).quantity++;
            }
        }

        this.#user.set(this.config.currency.user_path, this.#user.get(this.config.currency.user_path) - price);
        await this.#doc.addToBank(price, "user_actions");
        inventoryUser.data.inventory.push({ shopType: this.config.info.type, item_id: item.id, use_id: newUseId })

        let useHelp = `Úsalo con \`/use ${newUseId}\``;
        if (user) useHelp = `Úsalo con \`/use ${newUseId}\``;
        if (this.shopdoc.isSub(item)) useHelp = `Se te seguirá cobrando en el momento que uses/actives la suscripción: \`/use ${newUseId}\``;

        let desc = [
            "Pago realizado con éxito",
            `Compraste: \`${itemName}\` por **${this.config.currency.emoji}${itemPrice}**${user ? ` para ${user}` : ""}`,
            useHelp,
            `Ahora tienes: ${PrettyCurrency(this.interaction.guild, this.#isDarkShop ? this.#user.getDarkCurrency() : this.#user.getCurrency())}`
        ]

        if (user) await inventoryUser.save();
        await this.#user.save();

        let m = null;
        if (!item.use_info.manualUse) {
            desc.splice(2, 1);

            m = await this.interaction.followUp({ ephemeral: true, content: `${this.#Emojis.Loading} Usando automáticamente...` });

            const itemObj = await new Item(this.interaction, item.id, this.config.info.type).build(inventoryUser, this.#doc);
            await itemObj.use();
        }

        let embed = new Embed({
            type: "success",
            data: {
                desc
            }
        })

        return await this.interaction.editReply({ message: m, content: null, embeds: [embed] });

    }

    /** ------------------ EDICION ------------------ */
    async addDiscount(level, discount) {
        const id = FindNewId(await this.config.info.model.obj.find(), "discounts", "id");

        let q = this.shopdoc.discounts.find(x => x.level === level);
        if (q) {
            if (discount > 0) q.discount = discount
            else
                this.shopdoc.discounts.splice(this.shopdoc.discounts.findIndex(x => x.level === level), 1)
        } else {
            this.shopdoc.discounts.push({
                level,
                discount,
                id
            })
        }

        await this.shopdoc.save();

        return this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });
    }

    async addItem(params) {
        const newId = FindNewId(this.shopdoc.items, "", "id");

        let success = new Embed({
            type: "success",
            data: {
                desc: [
                    "Se ha agregado el item",
                    `No será visible hasta que se agregue el uso: ${this.client.mentionCommand("admin-shop use-info")}`,
                    `ID: \`${newId}\``
                ]
            }
        })

        this.shopdoc.items.push(
            {
                name: params.nombre.value,
                description: params.descripcion.value,
                price: params.precio.value,
                id: newId
            }
        )

        await this.shopdoc.save();
        return this.interaction.editReply({ embeds: [success] });
    }

    async editItem(params) {
        const item = this.shopdoc.findItem(params.id.value, false);

        // Mostrar la información actual del item
        return await this.interaction.editReply({
            embeds: [
                new Embed()
                    .defTitle(`Editar la información del item con ID \`${item.id}\``)
                    .defDesc(`▸ **${item.name}**.
${codeBlock(item.description)}
▸ **${this.config.currency.emoji}${item.price.toLocaleString("es-CO")}**.
▸ **+${this.config.currency.emoji}${item.interest.toLocaleString("es-CO")}** por compra.`)
                    .defColor(Colores.verdeclaro)
            ], components: [
                new ActionRowBuilder()
                    .setComponents(
                        new ButtonBuilder()
                            .setCustomId(`itemInfo-${item.id}-${this.config.info.type}`)
                            .setLabel("Información")
                            .setEmoji("📰")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`itemPrice-${item.id}-${this.config.info.type}`)
                            .setLabel("Precio")
                            .setEmoji("💰")
                            .setStyle(ButtonStyle.Primary),
                    )
            ]
        })
    }

    async editInfo(id, data) {
        const item = this.shopdoc.findItem(id, false)

        for (const prop of Object.keys(data)) {
            const value = data[prop];
            if (!value) continue;

            switch (prop) {
                case "name":
                    item.name = value;
                    break;
                case "desc":
                    item.description = value;
                    break;
                case "canHaveMany":
                    if (!new Enum(YesNo).exists(Number(value))) throw new BadParamsError(this.interaction, `\`${value}\` **NO** es un valor válido`);
                    item.canHaveMany = Number(value) === YesNo.Yes ? true : false;
                    break;
                case "price":
                    item.price = value;
                    break;
                case "interest":
                    item.interest = value;
                    break;
            }
        }

        await this.shopdoc.save();
        await this.interaction.editReply({ embeds: [this.#updated] });
    }

    async removeItem(itemId) {
        const index = this.shopdoc.findItemIndex(itemId);
        if (typeof index != "number") throw this.#noItemError;

        console.log("🗑️ Eliminando %s de la tienda e inventarios del Guild %s", this.shopdoc.findItem(itemId), this.interaction.guild.id)

        this.shopdoc.items.splice(index, 1);
        await this.shopdoc.save();

        // eliminar de los inventarios
        const users = await Users.find({ guild_id: this.interaction.guild.id });
        for await (const user of users) {
            let i = user.data.inventory.findIndex(x => x.item_id === itemId && x.shopType === this.config.info.type)

            if (i != -1) {
                console.log("🗑️ Eliminando del inventario de %s", user.user_id)
                user.data.inventory.splice(i, 1);
                await user.save();
            }
        }
        return this.interaction.editReply({ embeds: [new Embed({ type: "success", data: { title: "¡Eliminado!" } })] });
    }

    async toggleItem(itemId, duration = "50y") {
        let item = this.shopdoc.findItem(itemId, false)

        if (item.disabled) {
            item.disabled = false
            item.disabled_until = null
        } else {
            item.disabled = true
            item.disabled_until = moment().add(ms(duration ?? "50y"), "ms");
        }

        await this.shopdoc.save();

        return this.interaction.editReply({ embeds: [this.#updated] });
    }

    async editUse(params) {
        let specialType = null;

        // mascotas
        let itemConfig = null;
        let petStats = null;
        let stats = null;

        // external
        let getKeyActions = null, getMediaActions = null;
        let actions = [];
        let delays = {};

        if (params.especial?.value) { // Sí es un item especial
            let select = new StringSelectMenuBuilder()
                .setCustomId("specialItemSelect")
                .setPlaceholder("Escoge el tipo de Item")

            switch (this.config.info.type) {
                case ShopTypes.DarkShop:
                    select
                        .setOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Firewall")
                                .setDescription("No permite daños al usuario mientras esté activa")
                                .setValue(String(ItemTypes.Firewall)),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Stack Overflow")
                                .setDescription("~5% más de precisión en su uso")
                                .setValue(String(ItemTypes.StackOverflow)),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Reset Interés")
                                .setDescription("Elimina los intereses de un item de la tienda normal")
                                .setValue(String(ItemTypes.ResetInterest)),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Firewall Skipper")
                                .setDescription("Permite saltar la Firewall de un usuario")
                                .setValue(String(ItemTypes.SkipFirewall))
                        )
                    break;
                case ShopTypes.PetShop:
                    select
                        .setOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Mascota")
                                .setDescription("Es una mascota")
                                .setValue(String(ItemTypes.Pet)),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Modificador de estadísticas")
                                .setDescription("Agrega HP y/o quita el hambre")
                                .setValue(String(ItemTypes.PetStatsModifier))
                        )

                    petStats = async (inter) => {
                        await new Modal(inter)
                            .setCustomId("petStats")
                            .setTitle("Estadísticas base de Mascota")
                            .addInput({ id: "hp", label: "HP", placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short })
                            .addInput({ id: "attack", label: "Max Ataque", placeholder: "Escribe un número positivo", style: TextInputStyle.Short })
                            .addInput({ id: "defense", label: "Max Defensa", placeholder: "Escribe un número positivo", style: TextInputStyle.Short })
                            .show()

                        let c = await inter.awaitModalSubmit({ filter: (i) => i.customId === "petStats" && i.user.id === this.interaction.user.id, time: ms("1m") });
                        await c.deferUpdate();
                        return new Modal(c).read();
                    }

                    itemConfig = async (inter) => {
                        await new Modal(inter)
                            .setCustomId("petStatsModifier")
                            .setTitle("Configuración del item")
                            .addInput({ id: "hp", value: "0", label: "HP Dada", placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short })
                            .addInput({ id: "hunger", value: "0", label: "Hambre mitigada", placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short })
                            .show()

                        // TODO: Carga de ULT

                        let c = await inter.awaitModalSubmit({ filter: (i) => i.customId === "petStatsModifier" && i.user.id === this.interaction.user.id, time: ms("1m") });
                        await c.deferUpdate();
                        return new Modal(c).read();
                    }
                    break;

                case ShopTypes.EXShop:
                    select
                        .setOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Teclado")
                                .setDescription("Controla el teclado de un PC remotamente")
                                .setValue(String(ItemTypes.EXKeyboard)),
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Multimedia")
                                .setDescription("Reproduce multimedia a un PC remotamente")
                                .setValue(String(ItemTypes.EXMedia))
                        )

                    getKeyActions = async (inter) => {
                        await new Modal(inter)
                            .setCustomId("exKeysItemConfig")
                            .setTitle("Configuración del item")
                            .addInput({ id: "actions", value: "ALT TAB\nt\ne\nx\nt\no", label: "Teclas pulsadas", placeholder: "Teclas presionadas al tiempo en una sola linea. Teclas separadas por espacios.", style: TextInputStyle.Paragraph })
                            .addInput({ id: "keysDelay", value: "50", label: "Delay de teclas (ms)", placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short })
                            .addInput({ id: "globalUseDelay", value: "10m", label: "Delay de uso global", placeholder: "Escribe un número positivo", style: TextInputStyle.Short })
                            .addInput({ id: "individualUseDelay", value: "10m", label: "Delay de uso individual", placeholder: "Escribe un número positivo", style: TextInputStyle.Short })
                            .show()

                        let c = await inter.awaitModalSubmit({ filter: (i) => i.customId === "exKeysItemConfig" && i.user.id === this.interaction.user.id, time: ms("5m") });
                        await c.deferUpdate();
                        return new Modal(c).read();
                    }

                    getMediaActions = async (inter) => {
                        await new Modal(inter)
                            .setCustomId("exMediaItemConfig")
                            .setTitle("Configuración del item")
                            .addInput({ id: "urls", label: "Multimedia(s)", style: TextInputStyle.Paragraph })
                            .addInput({ id: "globalUseDelay", value: "10m", label: "Delay de uso global", placeholder: "Escribe un número positivo", style: TextInputStyle.Short })
                            .addInput({ id: "individualUseDelay", value: "10m", label: "Delay de uso individual", placeholder: "Escribe un número positivo", style: TextInputStyle.Short })
                            .show()

                        let c = await inter.awaitModalSubmit({ filter: (i) => i.customId === "exMediaItemConfig" && i.user.id === this.interaction.user.id, time: ms("5m") });
                        await c.deferUpdate();
                        return new Modal(c).read();
                    }
                    break;

                default:
                    select
                        .setOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel("No especial")
                                .setDescription("No hay items especiales para este tipo de tienda")
                                .setValue("0")
                        );
            }

            let components = [
                new ActionRowBuilder()
                    .setComponents(select)
            ]

            await this.interaction.editReply({ components })

            const filter = (inter) => inter.isStringSelectMenu() || inter.isButton() && inter.user.id === this.interaction.user.id;
            const collector = await new Collector(this.interaction, { filter, wait: true, max: 1 }, false, false)
                .wait(() => {
                    this.interaction.deleteReply();
                })
            if (!collector) return;

            specialType = Number(collector.values[0]);

            if (this.config.info.type === ShopTypes.PetShop) {
                switch (specialType) {
                    case ItemTypes.Pet:
                        stats = await petStats(collector);
                        break;
                    case ItemTypes.PetStatsModifier:
                        stats = await itemConfig(collector);
                        stats.attack = 0;
                        stats.defense = 0;
                        break;
                }
            } else
                if (this.config.info.type === ShopTypes.EXShop) {
                    switch (specialType) {
                        case ItemTypes.EXKeyboard:
                            let userActions = await getKeyActions(collector);

                            actions = userActions.actions?.split("\n") ?? [];

                            if (userActions.keysDelay) delays["keys"] = Number(userActions.keysDelay);
                            if (userActions.globalUseDelay) delays["global"] = ms(userActions.globalUseDelay);
                            if (userActions.individualUseDelay) delays["individual"] = ms(userActions.individualUseDelay);
                            break;
                        case ItemTypes.EXMedia:
                            let mediaActions = await getMediaActions(collector);

                            actions = mediaActions.urls?.split("\n") ?? [];

                            if (mediaActions.globalUseDelay) delays["global"] = ms(mediaActions.globalUseDelay);
                            if (mediaActions.individualUseDelay) delays["individual"] = ms(mediaActions.individualUseDelay);
                            break;
                    }

                }

            if (specialType === 0) specialType = null;
        }

        if (params.sub?.value) specialType = ItemTypes.Subscription;

        const subError = new BadParamsError(this.interaction, [
            "Si es una suscripción, **debe tener**: `duracion`",
            "**No puede ser** `especial`",
            "`duracion` **debe ser** mayor o igual a 1 minuto",
            "`objetivo` **debe ser** BOOST o ROLE",
            "`accion` **debe** AGREGAR"
        ]);

        const roleError = new BadParamsError(this.interaction, "Si se usa un tipo Role, **debe tener**: `role`");
        const boostError = new BadParamsError(this.interaction, [
            "Si se usa un tipo Boost __agregando__, **debe tener**: `boostobj`, `boosttype`, `boostval` y `duracion`",
            "Si es __eliminando__, **sólo debe tener**: `duracion`"
        ])
        const notValidCombination = new BadParamsError(this.interaction, "Si se usa un tipo Item, **no puede eliminarse**");
        const dsError = new BadParamsError(this.interaction, "Si el item es de la DarkShop, **debe tener**: `efecto` y verdadero en `uso-manual`");
        const notItemPetError = new BadParamsError(this.interaction, "Si el item es de la Tienda de Mascotas, su **objetivo** debe ser **Item** y ser **especial**");

        const item = this.shopdoc.findItem(params.id.value, false);
        if (!item) throw this.#noItemError;

        if (stats) item.stats = Object.assign({}, item.stats, stats);
        if (this.config.info.type === ShopTypes.EXShop) {
            item.use_info.external_info.type = specialType;
            if (actions.length > 0) item.use_info.external_info.actions = actions;
            item.use_info.external_info.delays = Object.assign(item.use_info.external_info.delays, delays);
        }

        item.reply = params.reply?.value ?? item.reply;

        const use = item.use_info;

        if (this.#isDarkShop && typeof params["uso-manual"].value === "boolean" && !params["uso-manual"].value) throw dsError;
        else use.manualUse = params["uso-manual"]?.value ?? use.manualUse;

        use.action = Number(params.accion.value);
        use.objetive = Number(params.objetivo.value);

        use.given = (
            use.objetive === ItemObjetives.Role ||
            use.objetive === ItemObjetives.Boost
        ) ? params.role?.value : params.cantidad?.value;

        use.effect = this.#isDarkShop ? params.efecto?.value : null;

        use.item_info.type = specialType ?? use.item_info.type;

        if (this.config.info.type === ShopTypes.PetShop && (use.objetive != ItemObjetives.Item || !use.item_info.type)) throw notItemPetError;

        use.item_info.duration = (use.objetive === ItemObjetives.Role ||
            use.objetive === ItemObjetives.Boost || this.shopdoc.isSub(item)) && params.duracion?.value ? ms(params.duracion?.value) : null

        use.boost_info.type = use.objetive === ItemObjetives.Boost ? params.boosttype?.value : null
        use.boost_info.value = use.objetive === ItemObjetives.Boost ? params.boostval?.value : null
        use.boost_info.objetive = use.objetive === ItemObjetives.Boost ? params.boostobj?.value : null

        // sub verification
        if (this.shopdoc.isSub(item)) {
            if (params.especial?.value) throw subError;
            if (!use.item_info.duration) throw subError;
            if (use.item_info.duration < ms("1m")) throw subError;
            if (!(use.objetive === ItemObjetives.Boost || use.objetive === ItemObjetives.Role)) throw subError;
            if (use.action != ItemActions.Add) throw subError;
        }

        // boost verification
        if (use.objetive === ItemObjetives.Boost) {
            if (!use.boost_info.type && use.action === ItemActions.Add) throw boostError;
            if (!use.boost_info.value && use.action === ItemActions.Add) throw boostError;
            if (!use.boost_info.objetive && use.action === ItemActions.Add) throw boostError;
            if (!use.item_info.duration) throw boostError;
        }

        // role verification
        if (use.objetive === ItemObjetives.Role) {
            if (!use.given) throw roleError;
        }

        if (use.objetive === ItemObjetives.Item) {
            if (use.action === ItemActions.Remove) throw notValidCombination;
        }

        // ds verification
        if (this.#isDarkShop) {
            if (!use.effect) throw dsError;
        }

        try {
            await this.shopdoc.save();
            await this.fixTempRoles(item);
        } catch (err) {
            if (err instanceof Error.ValidationError) throw new BadParamsError(this.interaction, [
                "Revisa los campos",
                err.message
            ])

            throw err
        }
        return this.interaction.editReply({ embeds: [this.#updated], components: [] });
    }

    /** ------------------ UTILIDAD ------------------ */
    #discountsWork(user, precio) {
        const inital_price = precio;
        const user_level = user.economy.global.level;
        const discounts = this.shopdoc.discounts;

        if (!discounts) return;

        // descuentos
        let query = discounts?.filter(x => user_level >= x.level)
            .sort(function (a, b) { // ordenar el array mayor a menor, por cantidad de descuento
                if (a.discount > b.discount) {
                    return -1;
                }
                if (a.discount < b.discount) {
                    return 1;
                }

                return 0;
            });

        const first = query[0];

        if (first) {
            precio -= ((precio) / 100) * first.discount; // aplicar el descuento

            precio = Math.floor(precio) > 0 ? Math.floor(precio) : Math.ceil(precio);

            return {
                precio,
                stringPrecio: `~~${inital_price.toLocaleString("es-CO")}~~ ${precio.toLocaleString("es-CO")}`
            }
        }
    }

    determinePrice(user, item, toString = false, noAdjustments = false) {
        const originalPrice = item.price;

        if (noAdjustments) {
            return toString ? originalPrice.toLocaleString("es-CO") : originalPrice;
        }

        // nuevo precio a partir de interés
        const interest = item.interest;
        const searchInterest = x => (x.shopType === this.config.info.type) && (x.item_id === item.id);
        const totalpurchases = user.data.purchases.find(searchInterest)?.quantity ?? 0;

        const interestPrice = originalPrice + (totalpurchases * interest);
        let precio = interestPrice;

        // para calmar a los mr inversiones
        if (this.#doc.toAdjust(new Enum(ShopTypes).translate(this.config.info.type).toLowerCase())) {
            let media = 0;
            this.shopdoc.items.forEach(i => media += i.price);
            media /= this.shopdoc.items.length;

            let multidiff = Math.floor(this.average / media);

            console.log("🏳️ El promedio de precios es %s", media)
            console.log("🏳️ dinero/media = %s", multidiff)

            if (multidiff > 100) {
                let fix = this.#isDarkShop ? multidiff / 50 : multidiff * 0.5;
                console.log("🟩 Fixing %s with %s", precio, fix)
                //console.log(this.average*0.1, "es el maximo")
                precio *= fix;
            }
        }

        let work = this.#discountsWork(user, precio);

        if (toString) {
            if (item.use_info.item_info?.type === ItemTypes.Subscription) {
                let sub = ` / ${new HumanMs(item.use_info.item_info?.duration).human}`;
                return work ? work.stringPrecio + sub : precio.toLocaleString("es-CO") + sub
            }
            return work?.stringPrecio ?? Math.floor(precio).toLocaleString("es-CO");
        }
        return Math.floor(work?.precio ?? precio);
    }

    async fixTempRoles(item) {
        switch (item.use_info.item_info.type) {
            case ItemTypes.Subscription: {
                for await (const user of await Users.find({ guild_id: this.interaction.guild.id })) {
                    const index = user.data.temp_roles.findIndex(x => x.activation_info?.item_id === item.id && x.activation_info?.shop_type === this.config.info.type)
                    if (index != -1) {
                        user.data.temp_roles[index].sub_info = Object.assign({}, user.data.temp_roles[index].sub_info, {
                            price: item.price,
                            interval: item.use_info.item_info.duration
                        })

                        // TODO: SendDirect();

                        await user.save();
                    }
                }
            }
        }
    }
}

module.exports = Shop;