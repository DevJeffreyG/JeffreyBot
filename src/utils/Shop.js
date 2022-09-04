const Discord = require("discord.js");
const models = require('mongoose').models
const { Users, Shops } = models;
const { FindNewId, Confirmation } = require("./functions")
const InteractivePages = require("./InteractivePages");
const { Colores, Emojis } = require("../resources");
const ErrorEmbed = require("./ErrorEmbed");
const Embed = require("./Embed");

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

        this.items = new Map();
        this.base = {
            title: `${this.interaction.guild.name} Shop`,
            author_icon: this.interaction.guild.iconURL({ dynamic: true }) ?? this.interaction.member.displayAvatarURL(),
            color: Colores.verdejeffrey,
            description: ``,
            addon: `**\`{item_id}\` — {item_name}**\n▸ {item_desc}\n▸ **${Emojis.Jeffros}{item_price}**\n\n`,
            footer: `Página {ACTUAL} de {TOTAL}`,
            icon_footer: this.interaction.guild.iconURL()
        }

        this.pages;
        this.user;
    }

    async setup() {
        this.user = await Users.getOrCreate({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id });
        this.base.description = `**—** ¡Bienvenid@ a la tienda! para comprar items usa \`/buy #\`.\n**—** Tienes **${Emojis.Jeffros}${this.user.economy.global.jeffros.toLocaleString("es-CO")}**`;

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

        if (!item) return this.interaction.editReply("literalmente no existe, matate");

        const itemPrice = this.determinePrice(user, item, true);
        const itemName = item.name;

        let toConfirm = [
            `¿Deseas comprar el item \`${itemName}\`?`,
            `Pagarás **${Emojis.Jeffros}${itemPrice}**.`,
            `Esta compra no se puede devolver.`
        ]

        if (item.interest > 0) toConfirm.push(`Al comprar el item, su precio subirá (**+${Emojis.Jeffros}${item.interest.toLocaleString("es-CO")}**)`)

        let confirmation = await Confirmation("Comprar item", toConfirm, this.interaction);
        if (!confirmation) return;

        var price = this.determinePrice(user, item);

        let noMoney = new ErrorEmbed(this.interaction, {
            type: "economyError",
            data: {
                action: "buy",
                error: "No tienes suficientes Jeffros",
                money: user.economy.global.jeffros
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

        if (!user.canBuy(price)) return noMoney.send();
        if (user.hasItem(itemId)) return hasItem.send();

        const newUseId = await FindNewId(await Users.find(), "data.inventory", "use_id");

        // revisar si debe agregarse interés
        if (item.interest > 0) {
            const interestFilter = x => x.isDarkShop === this.isDarkShop && x.item_id === item.id;
            if (!user.data.purchases.find(interestFilter)) user.data.purchases.push({ isDarkShop: this.isDarkShop, item_id: item.id, quantity: 1 });
            else {
                user.data.purchases.find(interestFilter).quantity++;
            }
        }

        user.economy.global.jeffros -= price;
        user.data.inventory.push({ item_id: item.id, use_id: newUseId })

        await user.save();

        let embed = new Embed({
            type: "success",
            data: {
                desc: [
                    "Pago realizado con éxito",
                    `Compraste: \`${itemName}\` por ${itemPrice}`,
                    `Úsalo con \`/use ${newUseId}\``,
                    `Ahora tienes: ${user.parseJeffros()}`
                ]
            }
        })
        return this.interaction.editReply({ embeds: [embed] });
    }

    async removeItem(itemId) {
        const index = this.shop.findItemIndex(itemId);
        if (!index) return this.interaction.editReply("Ese item no existe ❌")

        this.shop.items.splice(index, 1);
        await this.shop.save();
        return this.interaction.editReply("Eliminado ✅")
    }

    async addItem(params) {
        const newId = await FindNewId(this.shop.items, "", "id");

        this.shop.items.push(
            {
                name: params.nombre.value,
                description: params.descripcion.value,
                price: params.precio.value,
                id: newId
            }
        )

        await this.shop.save();
        return this.interaction.editReply("✅")
    }

    async editUse(params) {
        const item = this.shop.findItem(params.id.value, false);
        if (!item) return this.interaction.editReply(`No existe un item con id \`${params.id.value}\` ❌`)

        const use = item.after_use;

        use.action = params.accion.value;
        use.target = params.objetivo.value;
        use.given = use.target == "role" ? params.role.value : params.cantidad.value;
        use.reply = params.reply.value ?? use.reply;

        await this.shop.save();
        return this.interaction.editReply("Se ha actualizado el item ✅");
    }

    async editItem(params, subcommand) {


        const item = this.shop.findItem(params.id.value, false);
        if (!item) return this.interaction.editReply(`No existe un item con id \`${params.id.value}\` ❌`)

        switch (subcommand) {
            case "name":
                await this.#editName(item, params.nombre.value);
                break;
            case "desc":
                await this.#editDesc(item, params.descripcion.value);
                break;
        }

        return this.interaction.editReply("Se ha actualizado el item ✅")
    }

    async showAllItems() {
        this.user = await Users.getByUid(this.interaction.user.id);
        this.base.description = `**—** [NOT READY]: Falta el uso (\`/admin items action\`)\n**—** [HIDDEN]: Item desactivado (\`/admin items toggle\`)\n**—** [✅]: El item es visible y usable para cualquiera.`;
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

        return this._prepareInit();
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

    async #prepareInit() {
        const interactive = new InteractivePages(this.base, this.items)
        this.pages = interactive.pages;/* 

        let embed = new Discord.MessageEmbed()
        .setAuthor({name: this.base.title, iconURL: this.base.icon})
        .setColor(this.interaction.member.displayHexColor)
        .setDescription(`${this.base.description}\n\n${this.pages.get(1).join(" ")}`)
        .setFooter({text: this.base.footer.replace(new RegExp("{ACTUAL}", "g"), `1`).replace(new RegExp("{TOTAL}", "g"), `${this.pages.size}`), iconURL: this.base.icon_footer});
 */
        await interactive.init(this.interaction, this.client);
    }

    async #editName(item, value) {
        item.name = value;
        return this.shop.save();
    }

    async #editDesc(item, value) {
        item.description = value;
        return this.shop.save();
    }

    #discountsWork(user, precio) {
        const inital_price = precio;
        const user_level = user.economy.global.level;
        const discounts = this.shop.discounts;

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

    determinePrice(user, item, toString) {
        const originalPrice = item.price;

        // nuevo precio a partir de interés
        const interest = item.interest;
        const searchInterest = x => (x.isDarkShop === this.isDarkShop) && (x.item_id === item.id);
        const totalpurchases = user.data.purchases.find(searchInterest) ? user.data.purchases.find(searchInterest).quantity : 0;

        const interestPrice = originalPrice + (totalpurchases * interest);
        let precio = interestPrice;

        let work = this.#discountsWork(user, precio);

        if (toString) return work.stringPrecio;
        return work.precio;
    }
}

module.exports = Shop;