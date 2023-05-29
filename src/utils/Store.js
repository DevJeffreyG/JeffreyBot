const { Emoji, CommandInteraction, User } = require("discord.js");
const { Shops, DarkShops, Users } = require("mongoose").models;
const { Colores } = require("../resources");
const { ShopTypes, Enum, ItemTypes } = require("./Enums");
const InteractivePages = require("./InteractivePages");
const { BadCommandError, DoesntExistsError, EconomyError, AlreadyExistsError } = require("../errors");
const { Confirmation, FindNewId } = require("./functions");
const Embed = require("./Embed");

class Store {
    #build = false;
    #doc;
    #user;
    #interactive = {
        base: {},
        items: new Map()
    }

    #buildError;
    #noItemError;

    /**
     * @param {CommandInteraction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.client = this.interaction.client;

        this.#buildError = new BadCommandError(this.interaction, "STORE no se construyó");
        this.#noItemError = new DoesntExistsError(this.interaction, `El item con esa ID`, `la ${this.isDarkShop ? "DarkShop" : "tienda"} de este servidor`);

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
                emoji: null,
                user_path: null
            }
        }
    }

    /** PREPARATION */
    
    /**
     * @param {Enum} type 
     * @returns 
     */
    setType(type) {
        this.config.info.type = type;

        switch (type) {
            case ShopTypes.Shop:
                this.setCurrency(this.client.getCustomEmojis(this.interaction.guild.id).Currency)
                this.setInfo({
                    name: `Tienda de ${this.interaction.guild.name}`,
                    desc: `**—** ¡Bienvenid@ a la tienda! para comprar items usa ${this.client.mentionCommand("buy")}.`,
                    color: Colores.verdejeffrey,
                    model: Shops,
                    query: this.interaction.guild.id
                })
                break;

            case ShopTypes.DarkShop:
                this.setCurrency(this.client.getCustomEmojis(this.interaction.guild.id).DarkCurrency)
                this.setInfo({
                    name: `DarkShop de ${this.interaction.guild.name}`,
                    desc: `**—** Bienvenid@ a la DarkShop. Para comprar items usa ${this.client.mentionCommand("dsbuy")}.`,
                    color: Colores.negro,
                    model: DarkShops,
                    query: this.interaction.guild.id
                })
                break;
        }

        return this;
    }

    /**
     * @param {Emoji} CurrencyEmoji El Emoji que será usado para mostrar el dinero
     * @param {String} path La ruta de donde se sacará el dinero del usuario
     */
    setCurrency(CurrencyEmoji, path) {
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

        this.shop = await this.config.info.model.obj.getOrCreate(this.config.info.model.query);

        this.#interactive.base = {
            title: `${this.config.info.name}`,
            author_icon: this.interaction.guild.iconURL({ dynamic: true }),
            color: this.config.info.color,
            description: this.config.info.description + `\n**—** Tienes **${this.config.currency.emoji}${this.#user.get(this.config.currency.user_path).toLocaleString("es-CO")}**`,
            addon: `**\`{item_id}\` — {item_name}**\n▸ {item_desc}\n▸ **${this.config.currency.emoji}{item_price}**\n\n`,
            footer: `Página {ACTUAL} de {TOTAL}`,
            icon_footer: this.interaction.member.displayAvatarURL({ dynamic: true })
        }

        this.shop.items.forEach((item, index) => {
            let price = this.determinePrice(this.#user, item, true);

            this.#interactive.items.set(item.id, {
                item_name: item.name,
                item_desc: item.description,
                item_price: price,
                item_id: item.id,
                showable: (item.use_info.action !== null && !item.disabled) ?? false,
                index
            })
        });

        return this;
    }

    /** MAIN */
    async show(options = {}) {
        if (!this.#build) throw this.#buildError;

        const interactive = new InteractivePages(this.#interactive.base, this.#interactive.items, 3, options)

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
        if (!this.#build) throw this.#buildError;

        const inventoryUser = user ? await Users.getOrCreate({
            user_id: user.id,
            guild_id: this.interaction.guild.id
        }) : this.#user;

        const member = this.interaction.member;

        const item = this.shop.findItem(itemId);

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

        if (!this.#user.canBuy(price, this.config.currency.user_path))
            throw new EconomyError(
                this.interaction,
                `No tienes tantos ${this.config.currency.emoji.name}`,
                this.#user.get(this.config.currency.user_path),
                this.config.info.type === ShopTypes.DarkShop
            )
        if (this.#user.hasItem(itemId, this.config.info.type))
            throw new AlreadyExistsError(this.interaction, itemName, "tu inventario");

        const newUseId = FindNewId(await Users.find(), "data.inventory", "use_id");

        // revisar si debe agregarse interés
        if (item.interest > 0) {
            const interestFilter = x => x.shopType === this.config.info.type && x.item_id === item.id;
            if (!this.#user.data.purchases.find(interestFilter)) this.#user.data.purchases.push({ isDarkShop: this.isDarkShop, item_id: item.id, quantity: 1 });
            else {
                this.#user.data.purchases.find(interestFilter).quantity++;
            }
        }

        this.#user.set(this.config.currency.user_path, this.config.currency.user_path - price);
        inventoryUser.data.inventory.push({ shopType: this.config.info.type, item_id: item.id, use_id: newUseId })

        let embed = new Embed({
            type: "success",
            data: {
                desc: [
                    "Pago realizado con éxito",
                    `Compraste: \`${itemName}\` por **${this.config.currency.emoji}${itemPrice}**${user ? ` para ${user}` : ""}`,
                    user ? `Se usa con \`/use ${newUseId}\`` : `Úsalo con \`/use ${newUseId}\``,
                    `Ahora tienes: ${this.#user.parseCurrency(this.client.getCustomEmojis(this.interaction.guild.id), this.config.info.type === ShopTypes.DarkShop)}`
                ]
            }
        })

        if (user) await inventoryUser.save();
        await this.#user.save();

        return await this.interaction.editReply({ embeds: [embed] });
    }

    /** UTILITIES */
    #discountsWork(user, precio) {
        const inital_price = precio;
        const user_level = user.economy.global.level;
        const discounts = this.shop.discounts;

        if (!discounts) return;

        // descuentos
        let query = discounts?.filter(x => user_level >= x.level)
            .sort(function (a, b) { // ordenar el array mayor a menor, por array.level
                if (a.level > b.level) {
                    return -1;
                }
                if (a.level < b.level) {
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
            this.shop.items.forEach(i => media += i.price);
            media /= this.shop.items.length;

            let multidiff = Math.floor(this.average / media);

            console.log("🏳️ El promedio de precios es %s", media)
            console.log("🏳️ dinero/media = %s", multidiff)

            if (multidiff > 100) {
                let fix = this.config.info.type === ShopTypes.DarkShop ? multidiff / 50 : multidiff * 0.5;
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
}

module.exports = Store;