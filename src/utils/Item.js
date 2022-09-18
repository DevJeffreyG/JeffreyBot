const { GuildMember, SelectMenuBuilder, ActionRowBuilder } = require("discord.js")
const moment = require("moment");
const ms = require("ms")
const Chance = require("chance");

const Config = require("../resources/base.json");
const Colores = require("../resources/colores.json");

const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");
const { ItemTypes, ItemObjetives, ItemActions, ItemEffects } = require("./Enums");

const { FindNewId, LimitedTime, Subscription, WillBenefit } = require("./functions");

const models = require("mongoose").models;
const { Shops, DarkShops, Users, Guilds } = models;

class Item {
    constructor(interaction, id, isDarkShop = false) {
        this.isDarkShop = isDarkShop;
        this.interaction = interaction;
        this.member = interaction.member;
        this.itemId = id;

        this.#embeds();
    }

    #embeds() {
        let interaction = this.interaction;

        this.nowarns = new ErrorEmbed(interaction, {
            type: "errorFetch",
            data: {
                type: "warns",
                guide: "No existen warns vinculados a tu usuario",
            }
        })

        this.hasrole = new ErrorEmbed(interaction, {
            type: "alreadyExists",
            data: {
                action: "add role",
                existing: "El role que te da este item",
                context: "tu perfil"
            }
        })

        this.hasboost = new ErrorEmbed(interaction, {
            type: "alreadyExists",
            data: {
                action: "add boost",
                existing: "El boost que te da este item (te beneficia aún más)",
                context: "tu perfil"
            }
        })

        this.norole = new ErrorEmbed(interaction, {
            type: "doesntExist",
            data: {
                action: "remove role",
                existing: "El role que te quita este item",
                context: "tu perfil"
            }
        })

        this.actived = new ErrorEmbed(interaction, {
            type: "execError",
            data: {
                command: this.interaction.commandName,
                guide: "Este item ya está activado"
            }
        })

        this.canceled = new Embed()
            .defAuthor({ text: "Cancelado.", title: true })
            .defColor(Colores.nocolor);

    }

    async build() {
        this.doc = await Guilds.getOrCreate(this.interaction.guild.id);

        if (this.isDarkShop) this.shop = await DarkShops.getOrCreate(this.interaction.guild.id)
        else this.shop = await Shops.getOrCreate(this.interaction.guild.id);

        this.item = this.shop.findItem(this.itemId, false);
        this.user = await Users.getOrCreate({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id });

        this.#itemInfo()

        return this
    }

    #itemInfo() {
        // leer el uso y qué hace el item
        this.info = this.item.use_info;

        const {
            item_info, boost_info, effect, action, given, objetive
        } = this.info

        const { type, duration } = item_info

        this.type = type;
        this.given = given;

        this.action = action
        this.objetive = objetive
        this.effect = effect

        this.price = this.item.price;
        this.name = this.item.name;

        this.isTemp = this.shop.getItemType(this.item) === ItemTypes.Temporal;
        this.isSub = this.shop.getItemType(this.item) === ItemTypes.Subscription;
        this.disabled = this.item.disabled;

        this.duration = duration;

        this.boost_type = boost_info.type;
        this.boost_value = boost_info.value;
        this.boost_objetive = boost_info.objetive;
    }

    /**
     * 
     * @param {Number} id The UseId of the item
     * @param {GuildMember} [victim = null] The member affected (darkshop)
     * @returns 
     */
    async use(id, victim = null) {
        if (!this.#verify()) return;

        this.victim = victim?.id != this.user.user_id ? // la victima NO puede ser el mismo usuario
            await Users.getOrCreate({ user_id: victim?.id, guild_id: this.interaction.guild.id }) :
            null;

        this.victimMember = this.victim ? victim : null; // this.victim es el doc de mongoose

        console.log("🟢 %s está usando el item %s!", this.interaction.user.tag, this.item.name)

        const inventory = this.user.data.inventory;
        const inventoryFilter = x => x.use_id === id;

        this.itemInv = inventory.find(inventoryFilter);
        this.itemOnInventoryIndex = this.user.data.inventory.findIndex(inventoryFilter);

        this.success = new Embed({ type: "success", data: { desc: this.item.reply } });

        const work = await this.#useWork();

        if (work) {
            this.interaction.editReply({ embeds: [this.success], components: [], content: null });
            console.log("🟩 Item usado con éxito.")
        }
        console.log("===========================")
    }

    async #removeItemFromInv() {
        console.log("🗑️ Eliminando %s del inventario", this.item.name)
        this.user.data.inventory.splice(this.itemOnInventoryIndex, 1);
        await this.user.save();
    }

    async #useWork() {
        const action = this.action;
        const objetive = this.objetive;

        return new Promise(async (res) => {
            console.log("🗯️ Info del item: %s", this.info);

            let resolvable;

            switch (objetive) {
                case ItemObjetives.Warns:
                    this.given = Number(this.given);
                    if (action === ItemActions.Add) resolvable = this.#addWarns()
                    else resolvable = this.#removeWarns()
                    break;

                case ItemObjetives.Role:
                    if (action === ItemActions.Add) resolvable = this.#addRole()
                    else resolvable = this.#removeRole()
                    break;

                case ItemObjetives.Item:
                    if (action === ItemActions.Add) resolvable = this.#addItem()
                    else resolvable = this.#removeItem()
                    break;

                case ItemObjetives.Boost:
                    if (action === ItemActions.Add) resolvable = this.#addBoost()
                    else resolvable = this.#removeBoost()
                    break;
            }

            res(await resolvable);
        })
    }

    // WARNS
    async #addWarns() { // solo darkshop
        if (!await this.#darkshopWork()) return false;
        console.log("🗨️ Agregando %s warn(s)", this.given);

        const warns = this.victim.warns;

        for (let i = 0; i < this.given; i++) {
            const id = await FindNewId(await Users.find(), "warns", "id");
            this.victim.data.counts.warns += 1;
            warns.push({ rule_id: 0, id });

            await this.victim.save()
        }

        this.#removeItemFromInv()
        return true
    }

    async #removeWarns() {
        console.log("🗨️ Eliminando %s warn(s)", this.given);

        const warns = this.user.warns;

        if (warns?.length === 0) {
            console.log("🔴 NO tiene warns por eliminar.")
            this.nowarns.send();
            return false;
        }

        // eliminar warn(s) random
        for (let i = 0; i < this.given; i++) {
            this.user.warns.splice(Math.floor(Math.random() * warns.length), 1); // eliminar un warn random
            await this.user.save()
        }

        this.#removeItemFromInv()
        return true;
    }

    // ROLES
    async #addRole() {
        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        console.log("🗨️ Agregando el role %s a %s", role.name, this.interaction.user.tag);

        if (this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 Ya tiene el role que da el item.")
            this.hasrole.send();
            return false;
        }

        if (this.isTemp) this.user = await LimitedTime(this.member, this.given, this.duration);
        if (this.isSub) this.user = await Subscription(this.member, this.given, this.duration, this.price, this.name)
        else this.member.roles.add(role);

        this.#removeItemFromInv()
        return true;
    }

    async #removeRole() {
        if (!await this.#darkshopWork()) return false;
        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        console.log("🗨️ Eliminando el role %s a %s", role.name, this.interaction.user.tag);

        if (this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 No tiene el role que te quita el item.")
            this.norole.send();
            return false;
        }

        else this.member.roles.remove(role);

        this.#removeItemFromInv()
        return true;
    }

    // ITEMS
    async #addItem() {
        const itemType = this.type

        switch (itemType) {
            case ItemTypes.StackOverflow:
                console.log("🟩 Stack overflow!")

                let randomPercentage = Number((Math.random() * 5).toFixed(1));

                console.log("🟩 Se agregarán %s% al accuracy de %s", randomPercentage, this.interaction.user.tag)
                this.user.economy.dark.accuracy += randomPercentage
                if (this.user.economy.dark.accuracy > 90) this.user.economy.dark.accuracy = 90;
                await this.user.save()

                this.#removeItemFromInv()
                return true;

            case ItemTypes.Firewall:
                console.log("🟩 Firewall!");
                return await this.#activateItem();

            case ItemTypes.ResetInterest:
                console.log("🟩 Reset interest!")

                // hacer elegir qué interés eliminar
                const purchases = this.user.data.purchases;

                const row = new ActionRowBuilder()
                const selector = new SelectMenuBuilder()
                    .setCustomId("resetInterestMenu")
                    .setPlaceholder("¿A qué item quieres eliminarle el interés?");

                row.addComponents(selector)

                for (const purchase of purchases) {
                    if (purchase.isDarkShop) continue

                    let itemId = purchase.item_id;

                    // buscar el item en la tienda
                    let shop = await Shops.getOrCreate(this.interaction.guild.id);
                    let item = shop.findItem(itemId);

                    console.log(item)

                    selector.addOptions({ label: item.name, value: String(item.id) })
                }

                selector.addOptions({ label: "Cancelar", value: "cancel", emoji: "❌" })

                await this.interaction.editReply({ components: [row] });

                let filter = (i) => i.isSelectMenu() && i.customId === "resetInterestMenu" && i.user.id === this.interaction.user.id;
                const resetCollector = await this.interaction.channel.awaitMessageComponent({ filter, time: ms("1m") }).catch(() => { });

                if (!resetCollector || resetCollector.values[0] === "cancel") {
                    this.interaction.editReply({ embeds: [this.canceled], components: [] });
                    return false
                }

                await resetCollector.deferUpdate();
                const resetSelect = Number(resetCollector.values[0]); // item_id en purchases

                // resetear
                const purchaseFilter = x => x.item_id === resetSelect;

                let purchaseIndex = this.user.data.purchases.findIndex(purchaseFilter);

                this.user.data.purchases.splice(purchaseIndex, 1);
                await this.user.save()

                this.#removeItemFromInv();
                return true;

            default:
                console.log("Item simple! %s", itemType)
                return await this.#activateItem();
        }
    }

    async #removeItem() {
        if (!await this.#darkshopWork()) return false;

    }

    async #addBoost() {
        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        console.log("🗨️ Agregando el role como Boost %s a %s", role.name, this.interaction.user.tag);

        if (this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 Ya tiene el role que da el item. (BOOST)")
            this.hasrole.send();
            return false;
        }

        const willBenefit = await WillBenefit(this.member, [this.boost_objetive, "any"])
        if (willBenefit) {
            console.log("🔴 Se beneficiaría aún más")
            this.hasboost.send();
            return false
        }

        // llamar la funcion para hacer un globaldata y dar el role con boost
        this.user = await LimitedTime(this.interaction.member, role.id, this.duration, this.boost_type, this.boost_objetive, this.boost_value);

        this.#removeItemFromInv()
        return true;
    }

    async #removeBoost() {
        if (!await this.#darkshopWork()) return false;

    }

    async #darkshopWork() {
        if (this.item.use_info.effect === ItemEffects.Positive) return true

        let noVictim = new ErrorEmbed(this.interaction, {
            type: "execError",
            data: {
                command: this.interaction.commandName,
                guide: `¡Para poder usar este item **DEBE** aplicarse en __otro__ usuario!`
            }
        })

        if (!this.victim) {
            noVictim.send()
            return false;
        }

        const dsChannel = this.interaction.client.user.id === Config.testingJBID ?
            this.interaction.guild.channels.cache.find(x => x.id === "790431676970041356") :
            this.interaction.guild.channels.cache.find(x => x.id === Config.dsChannel);

        let skipped = new Embed()
            .defAuthor({ text: `Interacción`, icon: Config.darkLogoPng })
            .defDesc(`**—** ¡**${this.interaction.user.tag}** se ha volado la Firewall \`(${this.user.economy.dark.accuracy}%)\` y ha usado el item \`${this.item.name}\` en **${this.victimMember.user.tag}**!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.victimMember.user.tag}`, timestamp: true });

        let success = new Embed()
            .defAuthor({ text: `Interacción`, icon: Config.darkLogoPng })
            .defDesc(`**—** ¡**${this.interaction.user.tag}** ha usado el item \`${this.item.name}\` en **${this.victimMember.user.tag}**!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.victimMember.user.tag}`, timestamp: true });

        let fail = new Embed()
            .defAuthor({ text: `Interacción`, icon: Config.darkLogoPng })
            .defDesc(`**—** ¡**${this.interaction.user.tag}** ha querido usar el item \`${this.item.name}\` en **${this.victimMember.user.tag}** pero NO HA FUNCIONADO!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.victimMember.user.tag}`, timestamp: true });

        // como el efecto es negativo, hay que revisar la firewall
        const firewallItem = this.shop.items.find(x => x.use_info.item_info.type === ItemTypes.Firewall)
        const f = x => x.isDarkShop && x.item_id === firewallItem.id && x.active; // filtro

        const firewall = this.victim.data.inventory.find(f);
        const firewallIndex = this.victim.data.inventory.findIndex(f);

        if (firewall) { // tiene una firewall activa
            // ¿se la salta?
            let skip = new Chance().bool({ likelihood: this.user.economy.dark.accuracy });

            if (!skip) { // borrar la firewall, no se la salta
                // eliminar firewall
                this.victim.data.inventory.splice(firewallIndex, 1);
                await this.victim.save();

                // enviar embed
                dsChannel.send({ embeds: [fail] })

                await this.#removeItemFromInv() // como es fallido, no llega al codigo base para que se elimine el item
                this.interaction.deleteReply()
                return false;
            } else { // se salta la firewall
                dsChannel.send({ embeds: [skipped] })
                return true
            }
        } else { // no tiene firewall
            if (this.victim.economy.global.level >= 5) {
                dsChannel.send({ embeds: [success] })
                return true
            } else { // ni siquiera es parte de la red de la darkshop
                dsChannel.send({ embeds: [fail] })
                this.interaction.deleteReply()
                return false // para que no se elimine el item
            }
        }
    }

    async #activateItem() {
        console.log("💡 Activando %s", this.item.name)

        if (this.itemInv.active) {
            console.log("🔴 Ya está activo el item desde %s", moment(this.itemInv.active_since).format("DD [de] MMM (YYYY), HH:mm:ss"))
            this.actived.send();
            return false
        }

        this.itemInv.active = true
        this.itemInv.active_since = new Date();

        await this.user.save();
        return true
    }

    #verify() {
        if (!this.item) {
            let bad = new ErrorEmbed(this.interaction, {
                type: "badCommand",
                data: {
                    commandName: this.interaction.commandName,
                    error: "ReferenceError: this.item is not defined"
                }
            })
            console.log("🟥 NO EXISTE ESE ITEM, VERIFICA LA ID");
            bad.send();
            return false;
        }

        if (!this.action || this.disabled) {
            let noUse = new ErrorEmbed(this.interaction, {
                type: "execError",
                data: {
                    command: this.interaction.commandName,
                    guide: "Los administradores no han agregado un uso para este item"
                }
            })

            noUse.send()
            return false;
        }

        return true;
    }
}

module.exports = Item