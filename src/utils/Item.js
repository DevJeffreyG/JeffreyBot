const { GuildMember, StringSelectMenuBuilder, ActionRowBuilder, BaseInteraction, CommandInteraction, Collection } = require("discord.js")
const moment = require("moment-timezone");
const ms = require("ms")
const Chance = require("chance");

const { ItemTypes, ItemObjetives, ItemActions, ItemEffects, LogReasons, ChannelModules, ShopTypes } = require("./Enums");
const { BadCommandError, AlreadyExistsError, DoesntExistsError, FetchError, ExecutionError } = require("../errors");

const { FindNewId, LimitedTime, Subscription, WillBenefit, GetRandomItem } = require("./functions");

const Log = require("./Log");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");

const Colores = require("../resources/colores.json");

const models = require("mongoose").models;
const { Shops, DarkShops, Users, Guilds, GlobalDatas } = models;

class Item {
    /**
     * 
     * @param {BaseInteraction | CommandInteraction} interaction 
     * @param {Number} id 
     * @param {Number} type 
     */
    constructor(interaction, id, type = ShopTypes.Shop) {
        this.isDarkShop = type === ShopTypes.DarkShop ? true : false;
        this.shopType = type;

        this.interaction = interaction;
        this.member = interaction.member;
        this.itemId = id;

        this.#embeds();
    }

    #embeds() {
        let interaction = this.interaction;

        this.notfound = new ExecutionError(interaction, [
            "Algo no ha ido bien, no puede usar este item ahora mismo",
            `Dile a los administradores que revisen el uso del item con ID: \`${this.itemId}\``
        ])

        this.nowarns = new FetchError(interaction, "warns", ["Este usuario no tiene warns"]);

        this.hasrole = new AlreadyExistsError(interaction, "El role que da este item", "el destino");
        this.hasboost = new AlreadyExistsError(interaction, "El boost que da este item (te beneficia aún más)", "el destino");

        this.norole = new DoesntExistsError(interaction, "El role que quita este item", "el destino");

        this.actived = new ExecutionError(interaction, "Ya está activado este item");
        this.roleDeleted = new ExecutionError(interaction, "Ya se ha eliminado temporalmente este rol");
    }

    async build(user, doc) {
        this.doc = doc;
        this.user = user;

        switch (this.shopType) {
            case ShopTypes.DarkShop:
                this.shop = await DarkShops.getWork(this.interaction.guild.id);
                break;
            default:
                this.shop = await Shops.getWork(this.interaction.guild.id);
        }

        this.item = this.shop.findItem(this.itemId, false);

        this.#itemInfo();

        return this
    }

    #itemInfo() {
        this.#verify();

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
     * @param {GuildMember} [qvictim = null] The member affected (darkshop)
     * @returns 
     */
    async use(id, qvictim = this.interaction.member) {
        if (!this.#verify()) return false;

        this.original_executor = this.user;

        var victim = qvictim;

        this.victim = victim?.id != this.user.user_id && victim ? // la victima NO puede ser el mismo usuario
            await Users.getWork({ user_id: victim.id, guild_id: this.interaction.guild.id }) :
            null;

        if (!this.isDarkShop) { // la victima será el usuario si NO es la darkshop
            this.victim = await Users.getWork({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id });
            victim = this.interaction.member;
        }

        this.victimMember = this.victim ? victim : null; // this.victim es el doc de mongoose

        console.log("🟢 %s está usando el item %s!", this.interaction.user.username, this.item.name)

        const inventory = this.user.data.inventory;
        const inventoryFilter = x => x.use_id === id;

        this.itemInv = inventory.find(inventoryFilter);
        this.itemOnInventoryIndex = this.user.data.inventory.findIndex(inventoryFilter);

        this.success = new Embed({ type: "success", data: { desc: this.item.reply } });

        const work = await this.#useWork();

        if (work) {
            if (this.isDarkShop) {
                await this.interaction.editReply({ content: `${this.interaction.client.Emojis.Loading} Usando...` })
                await this.interaction.followUp({ ephemeral: true, embeds: [this.success], components: [], content: null });

                this.interaction.deleteReply()
            } else {
                this.interaction.editReply({ embeds: [this.success], components: [], content: null });
            }
            console.log("🟩 Item usado con éxito.")
        }
        console.log("===========================")
    }

    async #removeItemFromInv() {
        let originalExecutor = await Users.getWork({ user_id: this.original_executor.user_id, guild_id: this.original_executor.guild_id });
        console.log("🗑️ Eliminando %s del inventario de %s", this.item.name, this.original_executor.user_id)
        originalExecutor.data.inventory.splice(this.itemOnInventoryIndex, 1);
        await originalExecutor.save();
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
    async #addWarns() {
        if (!await this.#darkshopWork()) return false;
        console.log("🗨️ Agregando %s warn(s)", this.given);

        const warns = this.user.warns;

        for (let i = 0; i < this.given; i++) {
            const id = FindNewId(await Users.find(), "warns", "id");
            this.user.data.counts.warns += 1;
            warns.push({ rule_id: 0, id });

            await this.user.save()
        }

        this.#removeItemFromInv()
        return true
    }

    async #removeWarns() {
        if (!await this.#darkshopWork()) return false;
        console.log("🗨️ Eliminando %s warn(s)", this.given);

        const warns = this.user.warns;

        if (warns?.length === 0) {
            console.log("🔴 NO tiene warns por eliminar.")
            this.nowarns.send().catch(e => console.error(e));
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
        if (!await this.#darkshopWork()) return false;

        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        if (!role) {
            await new Log(this.interaction)
                .setReason(LogReasons.Error)
                .setTarget(ChannelModules.StaffLogs)
                .send({
                    embeds: [
                        new ErrorEmbed()
                            .defDesc(`\`ITEM ${this.itemId}\`: **No se encontró el role ${this.given} en el servidor.**`)
                    ]
                });

            console.log("🔴 No se encontro el role %s en el servidor", this.given);
            this.notfound.send().catch(e => console.error(e));
            return false;
        }
        console.log("🗨️ Agregando el role %s a %s", role.name, this.member.user.username);

        if (this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 Ya tiene el role que da el item.")
            this.hasrole.send().catch(e => console.error(e));;
            return false;
        }

        if (this.isTemp) {
            await LimitedTime(this.member, this.given, this.duration);
        }
        if (this.isSub) {
            try {
                await Subscription(this.member, this.given, this.duration, this.price, this.name)
            } catch (err) {
                console.log(err);

                await new Log(this.interaction)
                    .setReason(LogReasons.Error)
                    .setTarget(ChannelModules.StaffLogs)
                    .send({
                        embeds: [
                            new ErrorEmbed()
                                .defDesc(`\`ITEM ${this.itemId}\`: **Las suscripciones aún no están terminadas en la versión 2.0.0.**`)
                        ]
                    });

                this.notfound.send().catch(e => console.error(e));
                return false;
            }
        }
        else this.member.roles.add(role);

        this.#removeItemFromInv()
        return true;
    }

    async #removeRole() {
        if (!await this.#darkshopWork()) return false;
        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        if (!role) {
            await new Log(this.interaction)
                .setReason(LogReasons.Error)
                .setTarget(ChannelModules.StaffLogs)
                .send({
                    embeds: [
                        new ErrorEmbed()
                            .defDesc(`\`ITEM ${this.itemId}\`: **No se encontró el role ${this.given} en el servidor.**`)
                    ]
                });

            console.log("🔴 No se encontro el role %s en el servidor", this.given);
            this.notfound.send().catch(e => console.error(e));
            return false;
        }

        console.log("🗨️ Eliminando el role %s a %s por %s", role.name, this.member.user.username, this.duration);

        if (!this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 No tiene el role que quita el item. %s", this.member.roles.cache)
            this.norole.send().catch(e => console.error(e));
            return false;
        }

        // globaldata
        if (this.duration) {
            let globaldata = await GlobalDatas.newTempRoleDeletion({ user_id: this.member.id, guild_id: this.member.guild.id, role_id: role.id, duration: this.duration });
            if (!globaldata) {
                this.roleDeleted.send().catch(e => console.error(e));
                return false
            }
        }

        this.member.roles.remove(role);

        this.#removeItemFromInv()
        return true;
    }

    // ITEMS
    async #addItem() {
        if (!await this.#darkshopWork()) return false;
        const itemType = this.type

        switch (itemType) {
            case ItemTypes.StackOverflow:
                console.log("🟩 Stack overflow!")

                let randomPercentage = Number((Math.random() * 5).toFixed(1));

                console.log("🟩 Se agregarán %s% al accuracy de %s", randomPercentage, this.interaction.user.username)
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
                const selector = new StringSelectMenuBuilder()
                    .setCustomId("resetInterestMenu")
                    .setPlaceholder("¿A qué item quieres eliminarle el interés?");

                row.addComponents(selector)

                for (const purchase of purchases) {
                    if (purchase.isDarkShop) continue

                    let itemId = purchase.item_id;

                    // buscar el item en la tienda
                    let shop = await Shops.getWork(this.interaction.guild.id);
                    let item = shop.findItem(itemId);

                    console.log(item)

                    selector.addOptions({ label: item.name, value: String(item.id) })
                }

                selector.addOptions({ label: "Cancelar", value: "cancel", emoji: this.interaction.client.Emojis.Cross })

                await this.interaction.editReply({ components: [row] });

                let filter = (i) => i.isStringSelectMenu() && i.customId === "resetInterestMenu" && i.user.id === this.interaction.user.id;
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
        // TODO:
    }

    async #addBoost() {
        if (!await this.#darkshopWork()) return false;
        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        console.log("🗨️ Agregando el role como Boost %s a %s", role?.name ?? "SIN ROL", this.interaction.user.username);

        if (this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 Ya tiene el role que da el item. (BOOST)")
            this.hasrole.send().catch(e => console.error(e));
            return false;
        }

        const willBenefit = await WillBenefit(this.member, [this.boost_objetive, "any"])
        if (willBenefit && (this.item.use_info.effect === ItemEffects.Positive || !this.isDarkShop)) {
            console.log("🔴 Se beneficiaría aún más")
            this.hasboost.send().catch(e => console.error(e));;
            return false
        }

        // llamar la funcion para hacer un globaldata y dar el role con boost
        await LimitedTime(this.member, role?.id, this.duration, this.boost_type, this.boost_objetive, this.boost_value);

        this.#removeItemFromInv()
        return true;
    }

    async #removeBoost() {
        if (!await this.#darkshopWork()) return false;

        let filtered = this.boost_objetive ? this.user.data.temp_roles.filter(x => x.special.objetive === this.boost_objetive) : this.user.data.temp_roles;
        const temprole = GetRandomItem(filtered);

        const role = this.interaction.guild.roles.cache.find(x => x.id === temprole.role_id);

        console.log("🗨️ Eliminando el role %s a %s por %s", role?.name ?? "SIN ROL", this.member.user.username, this.duration);

        /* if (role && !this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 No tiene el role que te quita el item. %s", this.member.roles.cache)
            this.norole.send();
            return false;
        } */

        // globaldata
        let globaldata = await GlobalDatas.newTempRoleDeletion({
            user_id: this.member.id, guild_id: this.member.guild.id, role_id: role?.id, duration: this.duration, boost: this.boost_objetive,
            tempRoleObjectId: temprole._id
        });
        if (!globaldata) {
            this.roleDeleted.send().catch(e => console.error(e));
            return false
        }

        temprole.special.disabled = true;

        await this.user.save();
        if (role) this.member.roles.remove(role);

        this.#removeItemFromInv()
        return true;
    }

    async #darkshopWork() {
        if (this.item.use_info.effect === ItemEffects.Positive || !this.isDarkShop) return true
        if (this.victimMember) {
            this.user = this.victim;
            this.member = this.victimMember;
        }

        if (!this.victim) {
            new ExecutionError(this.interaction, "¡Para poder usar este item **DEBE** usarse en __otro__ usuario!")
                .send().catch(e => console.error(e));
            return false;
        }

        let dsEvents = await this.interaction.guild.channels.fetch(this.doc.getChannel("darkshop.events"));
        if (dsEvents instanceof Collection) dsEvents = null;

        let skipped = new Embed()
            .defAuthor({ text: `Interacción`, icon: this.interaction.client.EmojisObject.DarkShop.url })
            .defDesc(`**—** ¡**${this.interaction.user.username}** se ha volado la Firewall  y ha usado el item \`${this.item.name}\` en **${this.member.user.username}**!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.member.user.username}`, timestamp: true });

        let success = new Embed()
            .defAuthor({ text: `Interacción`, icon: this.interaction.client.EmojisObject.DarkShop.url })
            .defDesc(`**—** ¡**${this.interaction.user.username}** ha usado el item \`${this.item.name}\` en **${this.member.user.username}**!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.member.user.username}`, timestamp: true });

        let fail = new Embed()
            .defAuthor({ text: `Interacción`, icon: this.interaction.client.EmojisObject.DarkShop.url })
            .defDesc(`**—** ¡**${this.interaction.user.username}** ha querido usar el item \`${this.item.name}\` en **${this.member.user.username}** pero NO HA FUNCIONADO!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.member.user.username}`, timestamp: true });

        // como el efecto es negativo, hay que revisar la firewall
        const firewallItem = this.shop.items.find(x => x.use_info.item_info.type === ItemTypes.Firewall)
        const skipFirewallItem = this.shop.items.find(x => x.use_info.item_info.type === ItemTypes.SkipFirewall)
        const f = x => x.isDarkShop && x.item_id === firewallItem.id && x.active; // filtro

        const firewall = this.victim.data.inventory.find(f);
        const firewallIndex = this.victim.data.inventory.findIndex(f);

        if (firewall) { // tiene una firewall activa
            // ¿se la salta?
            let skip = this.user.hasItem(skipFirewallItem.id, ShopTypes.DarkShop) && new Chance().bool({ likelihood: this.doc.settings.quantities.percentage_skipfirewall })

            // eliminar el skip, se la salte o no
            if (this.user.hasItem(skipFirewallItem.id, ShopTypes.DarkShop)) {
                console.log("⚪ Se eliminó el skip de firewall de %s", this.interaction.user.username)
                let skipIndex = this.user.data.inventory.findIndex(x => x.item_id === skipFirewallItem.id && x.isDarkShop)

                console.log(skipIndex)
                this.user.data.inventory.splice(skipIndex, 1);
            }

            if (!skip) {
                // eliminar firewall
                this.victim.data.inventory.splice(firewallIndex, 1);
                await this.victim.save();

                // enviar embed
                dsEvents?.send({ content: `**${this.interaction.user.username}** ➡️ **${this.member}**.`, embeds: [fail], allowedMentions: { parse: ["users"] } })

                await this.#removeItemFromInv() // como es fallido, no llega al codigo base para que se elimine el item
                return false;
            } else { // se salta la firewall
                console.log("🟢 Se ha saltado la Firewall")
                dsEvents?.send({ content: `**${this.interaction.user.username}** ➡️ **${this.member}**.`, embeds: [skipped], allowedMentions: { parse: ["users"] } })
                return true
            }
        } else { // no tiene firewall
            if (this.victim.economy.global.level >= this.doc.settings.quantities.darkshop_level) {
                dsEvents?.send({ content: `**${this.interaction.user.username}** ➡️ **${this.member}**.`, embeds: [success], allowedMentions: { parse: ["users"] } })
                return true
            } else { // ni siquiera es parte de la red de la darkshop
                dsEvents?.send({ content: `**${this.interaction.user.username}** ➡️ **${this.member}**.`, embeds: [fail], allowedMentions: { parse: ["users"] } })

                return false // para que no se elimine el item
            }
        }
    }

    async #activateItem() {
        console.log("💡 Activando %s", this.item.name)

        if (this.itemInv.active) {
            console.log("🔴 Ya está activo el item desde %s", moment(this.itemInv.active_since).format("DD [de] MMM (YYYY), HH:mm:ss"))
            this.actived.send().catch(e => console.error(e));
            return false
        }

        this.itemInv.active = true
        this.itemInv.active_since = new Date();

        await this.user.save();
        return true
    }

    #verify() {
        if (!this.item) throw new BadCommandError(this.interaction, "this.item no está definido");
        if (!this.info) return; // Aun no se ha fetcheado

        if (!this.action || this.disabled) {
            new FetchError(this.interaction, `Item ${this.itemId}`, [
                "Los administradores no han agregado un uso para este item",
                "No lo podrás usar hasta que lo tenga"
            ])
                .send()
                .catch(e => console.error(e));
            return false;
        }

        return true;
    }
}

module.exports = Item