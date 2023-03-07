const { GuildMember, StringSelectMenuBuilder, ActionRowBuilder, BaseInteraction, CommandInteraction, Collection } = require("discord.js")
const moment = require("moment-timezone");
const ms = require("ms")
const Chance = require("chance");

const { ItemTypes, ItemObjetives, ItemActions, ItemEffects, LogReasons, ChannelModules, BoostObjetives } = require("./Enums");

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
     * @param {Boolean} isDarkShop 
     */
    constructor(interaction, id, isDarkShop = false) {
        this.isDarkShop = isDarkShop;
        this.interaction = interaction;
        this.member = interaction.member;
        this.itemId = id;

        this.#embeds();
    }

    #embeds() {
        let interaction = this.interaction;

        this.notfound = new ErrorEmbed(interaction, {
            type: "execError",
            data: {
                guide: `Algo no ha ido bien, no puedes usar este item ahora mismo. Dile a los administradores que revisen el uso del item con ID: \`${this.itemId}\`.`
            }
        })

        this.nowarns = new ErrorEmbed(interaction, {
            type: "errorFetch",
            data: {
                type: "warns",
                guide: "No existen warns vinculados al usuario",
            }
        })

        this.hasrole = new ErrorEmbed(interaction, {
            type: "alreadyExists",
            data: {
                action: "add role",
                existing: "El role que da este item",
                context: "el destino"
            }
        })

        this.hasboost = new ErrorEmbed(interaction, {
            type: "alreadyExists",
            data: {
                action: "add boost",
                existing: "El boost que da este item (te beneficia aún más)",
                context: "el destino"
            }
        })

        this.norole = new ErrorEmbed(interaction, {
            type: "doesntExist",
            data: {
                action: "remove role",
                missing: "El role que quita este item",
                context: "el destino"
            }
        })

        this.actived = new ErrorEmbed(interaction, {
            type: "execError",
            data: {
                command: this.interaction.commandName,
                guide: "Este item ya está activo"
            }
        })

        this.roleDeleted = new ErrorEmbed(interaction, {
            type: "execError",
            data: {
                command: this.interaction.commandName,
                guide: "Ya se ha eliminado temporalmente este rol"
            }
        })

    }

    async build() {
        this.doc = await Guilds.getOrCreate(this.interaction.guild.id);

        if (this.isDarkShop) this.shop = await DarkShops.getOrNull(this.interaction.guild.id)
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
     * @param {GuildMember} [qvictim = null] The member affected (darkshop)
     * @returns 
     */
    async use(id, qvictim = this.interaction.member) {
        if (!this.#verify()) return;

        var victim = qvictim;

        this.victim = victim?.id != this.user.user_id && victim ? // la victima NO puede ser el mismo usuario
            await Users.getOrCreate({ user_id: victim.id, guild_id: this.interaction.guild.id }) :
            null;

        if (!this.isDarkShop) { // la victima será el usuario si NO es la darkshop
            this.victim = await Users.getOrCreate({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id });
            victim = this.interaction.member;
        }

        this.victimMember = this.victim ? victim : null; // this.victim es el doc de mongoose

        console.log("🟢 %s está usando el item %s!", this.interaction.user.tag, this.item.name)

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
            const id = FindNewId(await Users.find(), "warns", "id");
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
        if (this.victimMember) this.member = this.victimMember;
        if (!await this.#darkshopWork()) return false;

        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        if (!role) {
            await new Log(this.interaction)
                .setReason(LogReasons.Error)
                .setTarget(ChannelModules.StaffLogs)
                .send({
                    embeds: [
                        new ErrorEmbed()
                            .defDesc(`${this.interaction.client.Emojis.Error} \`ITEM ${this.itemId}\`: **No se encontró el role ${this.given} en el servidor.**`)
                    ]
                });

            console.log("🔴 No se encontro el role %s en el servidor", this.given);
            this.notfound.send();
            return false;
        }
        console.log("🗨️ Agregando el role %s a %s", role.name, this.member.user.tag);

        if (this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 Ya tiene el role que da el item.")
            this.hasrole.send();
            return false;
        }

        if (this.isTemp) {
            let query = await LimitedTime(this.member, this.given, this.duration);

            if (!this.isDarkShop) this.user = query;
        }
        if (this.isSub) {
            try {
                this.user = await Subscription(this.member, this.given, this.duration, this.price, this.name)
            } catch (err) {
                console.log(err);

                await new Log(this.interaction)
                    .setReason(LogReasons.Error)
                    .setTarget(ChannelModules.StaffLogs)
                    .send({
                        embeds: [
                            new ErrorEmbed()
                                .defDesc(`${this.interaction.client.Emojis.Error} \`ITEM ${this.itemId}\`: **Las suscripciones aún no están terminadas en la versión 2.0.0.**`)
                        ]
                    });

                this.notfound.send();
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
                            .defDesc(`${this.interaction.client.Emojis.Error} \`ITEM ${this.itemId}\`: **No se encontró el role ${this.given} en el servidor.**`)
                    ]
                });

            console.log("🔴 No se encontro el role %s en el servidor", this.given);
            this.notfound.send();
            return false;
        }

        console.log("🗨️ Eliminando el role %s a %s por %s", role.name, this.victimMember.user.tag, this.duration);

        if (!this.victimMember.roles.cache.find(x => x === role)) {
            console.log("🔴 No tiene el role que quita el item. %s", this.victimMember.roles.cache)
            this.norole.send();
            return false;
        }

        // globaldata
        if (this.duration) {
            let globaldata = await GlobalDatas.newTempRoleDeletion({ user_id: this.victimMember.id, guild_id: this.victimMember.guild.id, role_id: role.id, duration: this.duration });
            if (!globaldata) {
                this.roleDeleted.send();
                return false
            }
        }

        this.victimMember.roles.remove(role);

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
                const selector = new StringSelectMenuBuilder()
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
        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        if (!role) {
            await new Log(this.interaction)
                .setReason(LogReasons.Error)
                .setTarget(ChannelModules.StaffLogs)
                .send({
                    embeds: [
                        new ErrorEmbed()
                            .defDesc(`${this.interaction.client.Emojis.Error} \`ITEM ${this.itemId}\`: **No se encontró el role ${this.given} en el servidor.**`)
                    ]
                });

            console.log("🔴 No se encontro el role %s en el servidor", this.given);
            this.notfound.send();
            return false;
        }
        console.log("🗨️ Agregando el role como Boost %s a %s", role.name, this.interaction.user.tag);

        if (this.member.roles.cache.find(x => x === role)) {
            console.log("🔴 Ya tiene el role que da el item. (BOOST)")
            this.hasrole.send();
            return false;
        }

        const willBenefit = await WillBenefit(this.member, [this.boost_objetive, BoostObjetives.All])
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

        let filtered = this.boost_objetive ? this.victim.data.temp_roles.filter(x => x.special.objetive === this.boost_objetive) : this.victim.data.temp_roles;
        const temprole = GetRandomItem(filtered);

        const role = this.interaction.guild.roles.cache.find(x => x.id === temprole.role_id);

        console.log("🗨️ Eliminando el role %s a %s por %s", role?.name, this.victimMember.user.tag, this.duration);

        if (role && !this.victimMember.roles.cache.find(x => x === role)) {
            console.log("🔴 No tiene el role que te quita el item. %s", this.victimMember.roles.cache)
            this.norole.send();
            return false;
        }

        // globaldata
        let globaldata = await GlobalDatas.newTempRoleDeletion({
            user_id: this.victimMember.id, guild_id: this.victimMember.guild.id, role_id: role?.id, duration: this.duration, boost: this.boost_objetive,
            tempRoleObjectId: temprole._id
        });
        if (!globaldata) {
            this.roleDeleted.send();
            return false
        }

        temprole.special.disabled = true;

        await this.victim.save();
        if(role) this.victimMember.roles.remove(role);

        this.#removeItemFromInv()
        return true;
    }

    async #darkshopWork() {
        if (this.item.use_info.effect === ItemEffects.Positive || !this.isDarkShop) return true

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

        let dsEvents = await this.interaction.guild.channels.fetch(this.doc.getChannel("darkshop.events"));
        if(dsEvents instanceof Collection) dsEvents = null;

        let skipped = new Embed()
            .defAuthor({ text: `Interacción`, icon: this.interaction.client.EmojisObject.DarkShop.url })
            .defDesc(`**—** ¡**${this.interaction.user.tag}** se ha volado la Firewall  y ha usado el item \`${this.item.name}\` en **${this.victimMember.user.tag}**!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.victimMember.user.tag}`, timestamp: true });

        let success = new Embed()
            .defAuthor({ text: `Interacción`, icon: this.interaction.client.EmojisObject.DarkShop.url })
            .defDesc(`**—** ¡**${this.interaction.user.tag}** ha usado el item \`${this.item.name}\` en **${this.victimMember.user.tag}**!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.victimMember.user.tag}`, timestamp: true });

        let fail = new Embed()
            .defAuthor({ text: `Interacción`, icon: this.interaction.client.EmojisObject.DarkShop.url })
            .defDesc(`**—** ¡**${this.interaction.user.tag}** ha querido usar el item \`${this.item.name}\` en **${this.victimMember.user.tag}** pero NO HA FUNCIONADO!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.victimMember.user.tag}`, timestamp: true });

        // como el efecto es negativo, hay que revisar la firewall
        const firewallItem = this.shop.items.find(x => x.use_info.item_info.type === ItemTypes.Firewall)
        const skipFirewallItem = this.shop.items.find(x => x.use_info.item_info.type === ItemTypes.SkipFirewall)
        const f = x => x.isDarkShop && x.item_id === firewallItem.id && x.active; // filtro

        const firewall = this.victim.data.inventory.find(f);
        const firewallIndex = this.victim.data.inventory.findIndex(f);

        if (firewall) { // tiene una firewall activa
            // ¿se la salta?
            let skip = this.user.hasItem(skipFirewallItem.id, true) && new Chance().bool({ likelihood: this.doc.settings.quantities.percentage_skipfirewall })

            // eliminar el skip, se la salte o no
            if (this.user.hasItem(skipFirewallItem.id, true)) {
                console.log("⚪ Se eliminó el skip de firewall de %s", this.interaction.user.tag)
                let skipIndex = this.user.data.inventory.findIndex(x => x.item_id === skipFirewallItem.id && x.isDarkShop)

                console.log(skipIndex)
                this.user.data.inventory.splice(skipIndex, 1);
            }

            if (!skip) {
                // eliminar firewall
                this.victim.data.inventory.splice(firewallIndex, 1);
                await this.victim.save();

                // enviar embed
                dsEvents?.send({ embeds: [fail] })

                await this.#removeItemFromInv() // como es fallido, no llega al codigo base para que se elimine el item
                return false;
            } else { // se salta la firewall
                console.log("🟢 Se ha saltado la Firewall")
                dsEvents?.send({ embeds: [skipped] })
                return true
            }
        } else { // no tiene firewall
            if (this.victim.economy.global.level >= this.doc.settings.quantities.darkshop_level) {
                dsEvents?.send({ embeds: [success] })
                return true
            } else { // ni siquiera es parte de la red de la darkshop
                dsEvents?.send({ embeds: [fail] })

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