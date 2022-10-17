const Discord = require("discord.js");
const moment = require("moment");
const ms = require("ms");

const models = require('mongoose').models

const { Users, Shops } = models;
const { FindNewId, Confirmation } = require("./functions")
const InteractivePages = require("./InteractivePages");
const { Colores, Emojis } = require("../resources");
const ErrorEmbed = require("./ErrorEmbed");
const Embed = require("./Embed");
const { ItemObjetives, ItemTypes } = require("./Enums");
const HumanMs = require("./HumanMs");

/**
 * Taken from [tutmonda](https://github.com/Jleguim/tutmonda-project) 💜
 */
class Shop {
    /**
     * 
     * @param {*} doc Mongoose doc (Shop)
     * @param {Discord.CommandInteraction} inter Interaction
     */
    constructor(doc, inter, isDarkShop = false) {
        this.isDarkShop = isDarkShop;
        this.shop = doc;
        this.shop.items = this.shop.items.sort((a, b) => a.id - b.id);

        this.interaction = inter;
        this.client = this.interaction.client;

        this.Emojis = this.client.Emojis;

        this.items = new Map();
        this.base = {
            title: `${this.interaction.guild.name} ${isDarkShop ? "DarkShop" : "Shop"}`,
            author_icon: this.interaction.guild.iconURL({ dynamic: true }) ?? this.interaction.member.displayAvatarURL(),
            color: isDarkShop ? Colores.negro : Colores.verdejeffrey,
            description: ``,
            addon: `**\`{item_id}\` — {item_name}**\n▸ {item_desc}\n▸ **${this.isDarkShop ? this.Emojis.DarkJeffros : this.Emojis.Jeffros}{item_price}**\n\n`,
            footer: `Página {ACTUAL} de {TOTAL}`,
            icon_footer: this.interaction.guild.iconURL()
        }

        this.pages;
        this.user;

        this.updated = new Embed({
            type: "success",
            data: {
                desc: "Se ha actualizado el item"
            }
        })

        this.noitem = new ErrorEmbed(this.interaction, {
            type: "errorFetch",
            data: {
                type: "item",
                guide: `No encontré el item con esa Id en la ${this.isDarkShop ? "DarkShop" : "tienda"}`
            }
        })
    }

    async setup() {
        this.user = await Users.getOrCreate({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id });
        if (this.isDarkShop)
            this.base.description = `**—** Bienvenid@ a la DarkShop. Para comprar items usa \`/dsbuy #\`.\n**—** Tienes **${this.Emojis.DarkJeffros}${this.user.economy.dark.darkjeffros.toLocaleString("es-CO")}**`;
        else
            this.base.description = `**—** ¡Bienvenid@ a la tienda! para comprar items usa \`/buy #\`.\n**—** Tienes **${this.Emojis.Jeffros}${this.user.economy.global.jeffros.toLocaleString("es-CO")}**`;

        this.shop.items.forEach((item, index) => {
            var price = this.determinePrice(this.user, item, true);

            this.items.set(item.id, {
                item_name: item.name,
                item_desc: item.description,
                item_price: price,
                item_id: item.id,
                showable: (item.use_info.action !== null && !item.disabled) ?? false,
                index
            })
        });

        return this.#prepareInit();
    }

    async buy(itemId) {
        const member = this.interaction.member;

        let user = await Users.getOrCreate({
            user_id: this.interaction.user.id,
            guild_id: this.interaction.guild.id
        });
        const item = this.shop.findItem(itemId);

        let noitem = new ErrorEmbed(this.interaction, {
            type: "execError",
            data: {
                command: this.interaction.commandName,
                guide: `El item con la ID \`${itemId}\` NO existe.`
            }
        })

        if (!item) return noitem.send();

        const itemPrice = this.determinePrice(user, item, true);
        const itemName = item.name;

        let toConfirm = [
            `¿Deseas comprar el item \`${itemName}\`?`,
            `Pagarás **${this.isDarkShop ? this.Emojis.DarkJeffros : this.Emojis.Jeffros}${itemPrice}**.`,
            `Esta compra no se puede devolver.`
        ]

        if (item.interest > 0) toConfirm.push(`Al comprar el item, su precio subirá (**+${this.isDarkShop ? this.Emojis.DarkJeffros : this.Emojis.Jeffros}${item.interest.toLocaleString("es-CO")}**)`)

        let confirmation = await Confirmation("Comprar item", toConfirm, this.interaction);
        if (!confirmation) return;

        var price = this.determinePrice(user, item);

        let noMoney = new ErrorEmbed(this.interaction, {
            type: "economyError",
            data: {
                action: "buy",
                error: `No tienes suficientes ${this.isDarkShop ? "DarkJeffros" : "DarkJeffros"}`,
                money: this.isDarkShop ? user.economy.dark.darkjeffros : user.economy.global.jeffros,
                darkshop: this.isDarkShop
            }
        })

        let hasItem = new ErrorEmbed(this.interaction, {
            type: "alreadyExists",
            data: {
                action: "buy",
                existing: itemName,
                context: "tu inventario"
            }
        })

        let doesntHaveRole = new ErrorEmbed(this.interaction, {
            type: "doesntExist",
            data: {
                action: "buy",
                missing: `<@&${item.req_role}>`,
                context: "en tu usuario"
            }
        })

        let hasRoleToGive = new ErrorEmbed(this.interaction, {
            type: "alreadyExists",
            data: {
                action: "buy",
                existing: `<@&${item.use_info.given}>`,
                context: "tu perfil"
            }
        })

        // role requerido
        if (item.req_role && !member.roles.cache.find(x => x.id === item.req_role)) return doesntHaveRole.send();

        // buscar si ya tiene el role que se da
        if (item.use_info.action === "add" && item.use_info.objetive === "role" && member.roles.cache.find(x => x.id === item.use_info.given)) return hasRoleToGive.send();

        if (!user.canBuy(price, this.isDarkShop)) return noMoney.send();
        if (user.hasItem(itemId, this.isDarkShop)) return hasItem.send();

        const newUseId = await FindNewId(await Users.find(), "data.inventory", "use_id");

        // revisar si debe agregarse interés
        if (item.interest > 0) {
            const interestFilter = x => x.isDarkShop === this.isDarkShop && x.item_id === item.id;
            if (!user.data.purchases.find(interestFilter)) user.data.purchases.push({ isDarkShop: this.isDarkShop, item_id: item.id, quantity: 1 });
            else {
                user.data.purchases.find(interestFilter).quantity++;
            }
        }

        if (this.isDarkShop) user.economy.dark.darkjeffros -= price;
        else user.economy.global.jeffros -= price;
        user.data.inventory.push({ isDarkShop: this.isDarkShop, item_id: item.id, use_id: newUseId })

        let embed = new Embed({
            type: "success",
            data: {
                desc: [
                    "Pago realizado con éxito",
                    `Compraste: \`${itemName}\` por **${this.isDarkShop ? this.Emojis.DarkJeffros : this.Emojis.Jeffros}${itemPrice}**`,
                    `Úsalo con \`/use ${newUseId}\``,
                    `Ahora tienes: ${user.parseJeffros(this.Emojis, this.isDarkShop)}`
                ]
            }
        })

        await user.save();
        return this.interaction.editReply({ embeds: [embed] });
    }

    async removeItem(itemId) {
        const index = this.shop.findItemIndex(itemId);
        if (!index) return this.noitem.send();

        console.log("🗑️ Eliminando %s de la tienda e inventarios del Guild %s", this.shop.findItem(itemId), this.interaction.guild.id)

        this.shop.items.splice(index, 1);
        await this.shop.save();

        // eliminar de los inventarios
        const users = await Users.find({ guild_id: this.interaction.guild.id });
        for await (const user of users) {
            let i = user.data.inventory.findIndex(x => x.item_id === itemId && x.isDarkShop === this.isDarkShop)

            if (i != -1) {
                console.log("🗑️ Eliminando del inventario de %s", user.user_id)
                user.data.inventory.splice(i, 1);
                await user.save();
            }
        }
        return this.interaction.editReply({ embeds: [new Embed({ type: "success", data: { title: "¡Eliminado!" } })] });
    }

    async addItem(params) {
        const newId = await FindNewId(this.shop.items, "", "id");

        let success = new Embed({
            type: "success",
            data: {
                desc: [
                    "Se ha agregado el item",
                    `No será visible hasta que se agregue el uso: \`/admin items use-info\``,
                    `ID: \`${newId}\``
                ]
            }
        })

        this.shop.items.push(
            {
                name: params.nombre.value,
                description: params.descripcion.value,
                price: params.precio.value,
                id: newId
            }
        )

        await this.shop.save();
        return this.interaction.editReply({ embeds: [success] });
    }

    async editUse(params) {
        let roleError = new ErrorEmbed(this.interaction, {
            type: "execError",
            data: {
                command: this.interaction.commandName,
                guide: `Si se usa un tipo role, **debe tener**: \`role\` y \`duracion\`.`
            }
        })

        let boostError = new ErrorEmbed(this.interaction, {
            type: "execError",
            data: {
                command: this.interaction.commandName,
                guide: `Si se usa un tipo boost, **debe tener**: \`role\`, \`boostobj\`, \`boosttype\`, \`boostval\` y \`duracion\`.
Si es para la DarkShop, **sólo debe tener**: \`boostobj\` y \`duracion\`.`
            }
        })

        let dsError = new ErrorEmbed(this.interaction, {
            type: "execError",
            data: {
                command: this.interaction.commandName,
                guide: `Si el item es de la DarkShop, **debe tener**: \`efecto\`.`
            }
        })
        const item = this.shop.findItem(params.id.value, false);
        if (!item) return this.noitem.send();

        item.reply = params.reply?.value ?? item.reply;

        const use = item.use_info;

        use.action = params.accion.value;
        use.objetive = Number(params.objetivo.value);

        use.given = (
            use.objetive == ItemObjetives.Role ||
            use.objetive == ItemObjetives.Boost
        ) ? params.role?.value : params.cantidad?.value;

        use.effect = this.isDarkShop ? params.efecto?.value : null;

        use.item_info.type = params.especial?.value ?? use.item_info.type;
        use.item_info.duration = use.objetive == ItemObjetives.Role ||
            use.objetive == ItemObjetives.Boost && params.duracion?.value ? ms(params.duracion?.value) : null

        use.boost_info.type = ItemObjetives.Boost ? params.boosttype?.value : null
        use.boost_info.value = ItemObjetives.Boost ? params.boostval?.value : null
        use.boost_info.objetive = ItemObjetives.Boost ? params.boostobj?.value : null

        // boost verification
        if (use.objetive === ItemObjetives.Boost) {
            if (!use.given && !this.isDarkShop) return boostError.send();
            if (!use.boost_info.type && !this.isDarkShop) return boostError.send();
            if (!use.boost_info.value && !this.isDarkShop) return boostError.send();
            if (!use.boost_info.objetive) return boostError.send();
            if (!use.item_info.duration) return boostError.send();
        }

        // role verification
        if (use.objetive === ItemObjetives.Role) {
            if (!use.given) return roleError.send();
            if (!use.item_info.duration) return roleError.send();
        }

        // ds verification

        if (this.isDarkShop) {
            if (!use.effect) return dsError.send();
        }

        await this.shop.save();
        return this.interaction.editReply({ embeds: [this.updated] });
    }

    async editItem(params, subcommand) {


        const item = this.shop.findItem(params.id.value, false);
        if (!item) return this.noitem.send();

        switch (subcommand) {
            case "name":
                await this.#editName(item, params.nombre.value);
                break;
            case "desc":
                await this.#editDesc(item, params.descripcion.value);
                break;

            case "price":
                await this.#editPrice(item, params.precio.value);
                break;
        }

        return this.interaction.editReply({ embeds: [this.updated] })
    }

    async showAllItems() {
        this.user = await Users.getOrCreate({
            user_id: this.interaction.user.id,
            guild_id: this.interaction.guild.id
        });

        this.base.description = `**—** [NOT READY]: Falta el uso (\`/admin items use-info\`)\n**—** [HIDDEN]: Item desactivado (\`/admin items toggle\`)\n**—** [✅]: El item es visible y usable para cualquiera.`;
        this.base.addon = this.base.addon.substring(0, 2) + "{publicInfo} — ID: " + this.base.addon.substr(2)

        this.shop.items.forEach((item, index) => {
            let publicInfo;
            if (!item.use_info.action) publicInfo = "[NOT READY] ";
            else if (item.disabled) publicInfo = "[HIDDEN] ";
            else publicInfo = "[✅] ";

            var price = this.determinePrice(this.user, item, true);

            this.items.set(item.id, {
                item_name: item.name,
                item_desc: item.description,
                item_price: price,
                item_id: item.id,
                publicInfo,
                index
            })
        });

        return this.#prepareInit();
    }

    async addDiscount(level, discount) {
        const id = await FindNewId(await Shops.find(), "discounts", "id");

        this.shop.discounts.push({
            level,
            discount,
            id
        })

        await this.shop.save();

        return this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });
    }

    async toggleItem(itemId, duration) {
        let item = this.shop.findItem(itemId, false)

        if (item.disabled) {
            item.disabled = false
            item.disabled_until = null
        } else {
            item.disabled = true
            item.disabled_until = moment().add(ms(duration), "ms");
        }

        await this.shop.save();

        return this.interaction.editReply({ embeds: [this.updated] });
    }

    async #prepareInit() {
        const interactive = new InteractivePages(this.base, this.items)
        this.pages = interactive.pages;

        await interactive.init(this.interaction);
    }

    async #editName(item, value) {
        item.name = value;
        return this.shop.save();
    }

    async #editDesc(item, value) {
        item.description = value;
        return this.shop.save();
    }

    async #editPrice(item, value) {
        item.price = value;
        return this.shop.save();
    }

    #discountsWork(user, precio) {
        const inital_price = precio;
        const user_level = user.economy.global.level;
        const discounts = this.shop.discounts;

        if (!discounts || this.isDarkShop) return;

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

    determinePrice(user, item, toString = false) {
        const originalPrice = item.price;

        // nuevo precio a partir de interés
        const interest = item.interest;
        const searchInterest = x => (x.isDarkShop === this.isDarkShop) && (x.item_id === item.id);
        const totalpurchases = user.data.purchases.find(searchInterest)?.quantity ?? 0;

        const interestPrice = originalPrice + (totalpurchases * interest);
        let precio = interestPrice;

        let work = this.#discountsWork(user, precio);

        if (toString) {
            if (item.use_info.item_info?.type === ItemTypes.Subscription) {
                let sub = ` / ${new HumanMs(item.use_info.item_info?.duration).human}`;
                return work ? work.stringPrecio + sub : precio.toLocaleString("es-CO") + sub
            }
            return work?.stringPrecio ?? precio.toLocaleString("es-CO");
        }
        return work?.precio ?? precio;
    }
}

module.exports = Shop;