const { GuildMember, StringSelectMenuBuilder, ActionRowBuilder, BaseInteraction, CommandInteraction, Collection, time, TextInputStyle, ButtonBuilder, ButtonStyle, DiscordjsErrorCodes } = require("discord.js")
const moment = require("moment-timezone");
const ms = require("ms")
const superagent = require("superagent");
const jwt = require("jsonwebtoken");
const Chance = require("chance");

const { ItemTypes, ItemObjetives, ItemActions, ItemEffects, LogReasons, ChannelModules, ShopTypes, PetAttacksType, Enum, BoostObjetives, ModuleBans } = require("./Enums");
const { BadCommandError, AlreadyExistsError, DoesntExistsError, FetchError, ExecutionError, ModuleBannedError } = require("../errors");

const { FindNewId, LimitedTime, Subscription, WillBenefit, isDeveloper, CreateInteractionFilter, FindNewIds } = require("./functions");

const Log = require("./Log");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");

const Colores = require("../resources/colores.json");
const Collector = require("./Collector");
const Pet = require("./Pet");
const JeffreyBotError = require("../errors/JeffreyBotError");
const HumanMs = require("./HumanMs");
const Modal = require("./Modal");

const models = require("mongoose").models;
const { Shops, DarkShops, Users, PetShops, EXShops, GlobalDatas } = models;

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

        this.canceled = new Embed({ type: "cancel" });
    }

    async build(user, doc) {
        this.doc = doc;
        this.user = user;
        this.original_executor = this.user;

        switch (this.shopType) {
            case ShopTypes.DarkShop:
                this.shop = await DarkShops.getWork(this.interaction.guild.id);
                break;
            case ShopTypes.PetShop:
                this.shop = await PetShops.getWork(this.interaction.guild.id);
                break;
            case ShopTypes.EXShop:
                this.shop = await EXShops.getWork(this.interaction.guild.id);
                break;
            default:
                this.shop = await Shops.getWork(this.interaction.guild.id);
        }

        this.item = this.shop.findItem(this.itemId, false);
        this.itemIndex = this.shop.items.findIndex(x => x === this.item);

        const inventory = this.user.data.inventory;
        const inventoryFilter = x => x.item_id === this.itemId && x.shopType === this.shopType;

        this.itemInv = inventory.find(inventoryFilter);
        this.itemOnInventoryIndex = this.user.data.inventory.findIndex(inventoryFilter);

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
        this.isSub = this.shop.isSub(this.item);
        this.disabled = this.item.disabled;

        this.duration = duration;

        this.boost_type = boost_info.type;
        this.boost_value = boost_info.value;
        this.boost_objetive = boost_info.objetive;
    }

    /**
     * @param {GuildMember} [qvictim = null] The member affected (darkshop)
     * @returns {Promise<void>}
     */
    async use(qvictim = this.interaction.member) {
        if (!this.#verify()) return false;

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

        this.success = new Embed({ type: "success", data: { desc: this.item.reply } });

        const work = await this.#useWork();

        if (work) {
            if (this.isDarkShop) {
                await this.interaction.editReply({ content: `${this.interaction.client.Emojis.Loading} Usando...` })
                    .catch(err => {
                        console.error("🔴 %s", err);
                    });
                await this.interaction.followUp({ ephemeral: true, embeds: [this.success], components: [], content: null })
                    .catch(err => {
                        console.error("🔴 %s", err);
                    });

                await this.interaction.deleteReply()
                    .catch(err => {
                        console.error("🔴 %s", err);
                    });
            } else {
                await this.interaction.editReply({ embeds: [this.success], components: [], content: null })
                    .catch(err => {
                        console.error("🔴 %s", err);
                    });;
            }
            console.log("🟩 Item usado con éxito.")
        }
        console.log("===========================")
    }

    async removeItemFromInv(save = true) {
        let originalExecutor = await Users.getWork({ user_id: this.original_executor.user_id, guild_id: this.original_executor.guild_id });
        console.log("🗑️ Eliminando %s del inventario de %s", this.item.name, this.original_executor.user_id)
        originalExecutor.data.inventory.splice(this.itemOnInventoryIndex, 1);
        if (save) await originalExecutor.updateOne(originalExecutor);
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
        const ids = FindNewIds(await Users.find(), "warns", "id", this.given);

        for (let i = 0; i < this.given; i++) {
            const id = ids.shift();
            this.user.addCount("warns", 1, false);
            warns.push({ rule_id: 0, id });
        }

        try {
            await this.user.save()
        } catch (err) {
            console.error("🔴 %s", err);
        }

        await this.removeItemFromInv();
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

        if (this.given > warns.length) this.given = warns.length;

        // eliminar warn(s) random
        for (let i = 0; i < this.given; i++) {
            this.user.warns.splice(Math.floor(Math.random() * warns.length), 1); // eliminar un warn random            
        }

        try {
            await this.user.save()
        } catch (err) {
            console.error("🔴 %s", err);
        }

        await this.removeItemFromInv();
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
            await LimitedTime(this.member, this.given, this.duration, {
                item_id: this.itemId,
                shop_type: this.shopType
            });
        }
        if (this.isSub) {
            try {
                await Subscription(this.member, this.given, {}, {
                    item_id: this.itemId,
                    shop_type: this.shopType
                }, this.duration, this.price, this.name)
            } catch (err) {
                console.error("🔴", err);

                this.notfound.send().catch(e => console.error(e));
                return false;
            }
        }
        else this.member.roles.add(role);

        await this.removeItemFromInv()
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

        await this.removeItemFromInv()
        return true;
    }

    // ITEMS
    async #addItem() {
        if (!await this.#darkshopWork()) return false;
        const itemType = this.type

        let ttsData;

        switch (itemType) {
            case ItemTypes.StackOverflow:
                console.log("🟩 Stack overflow!")

                let randomPercentage = Number((Math.random() * 5).toFixed(1));

                console.log("🟩 Se agregarán %s% al accuracy de %s", randomPercentage, this.interaction.user.username)
                this.user.economy.dark.accuracy += randomPercentage
                if (this.user.economy.dark.accuracy > 90) this.user.economy.dark.accuracy = 90;
                await this.user.save()

                await this.removeItemFromInv();
                return true;

            case ItemTypes.Firewall:
                console.log("🟩 Firewall!");
                return await this.#activateItem();

            case ItemTypes.ResetInterest: {
                console.log("🟩 Reset interest!")

                // hacer elegir qué interés eliminar
                const purchases = this.user.data.purchases;

                const row = new ActionRowBuilder()
                const selector = new StringSelectMenuBuilder()
                    .setCustomId("resetInterestMenu")
                    .setPlaceholder("¿A qué item quieres eliminarle el interés?");

                row.addComponents(selector)

                let modifiedPurchases = false;
                for (const purchase of purchases) {
                    if (purchase.shopType === ShopTypes.DarkShop) continue

                    let itemId = purchase.item_id;

                    // buscar el item en la tienda
                    let shop = await Shops.getWork(this.interaction.guild.id);
                    let item = shop.findItem(itemId);

                    // Si no encuentra el item en la tienda significa que ya no existe
                    if (!item) {
                        modifiedPurchases = true;
                        this.user.data.purchases.splice(purchases.findIndex(x => x === purchase), 1)
                        continue
                    }

                    selector.addOptions({ description: `Item de la ${new Enum(ShopTypes).translate(purchase.shopType)}`, label: item.name, value: String(item.id) });
                }

                selector.addOptions({ label: "Cancelar", value: "cancel", emoji: this.interaction.client.Emojis.Cross })

                let resetMsg = await this.interaction.editReply({ components: [row] });

                const resetCollector = await new Collector(this.interaction, {
                    filter: CreateInteractionFilter(this.interaction, resetMsg),
                    time: ms("1m"),
                    wait: true
                }, false, false).wait(() => {
                    this.interaction.editReply({ embeds: [this.canceled], components: [] });
                    try {
                        if (modifiedPurchases) this.user.save()
                    } catch (err) {
                        console.error("🔴 %s", err);
                    }
                })
                if (!resetCollector) return;

                if (resetCollector.values[0] === "cancel") {
                    this.interaction.editReply({ embeds: [this.canceled], components: [] });
                    try {
                        if (modifiedPurchases) await this.user.save()
                    } catch (err) {
                        console.error("🔴 %s", err);
                    }
                    return false
                }

                await resetCollector.deferUpdate();
                const resetSelect = Number(resetCollector.values[0]); // item_id en purchases

                // resetear
                const purchaseFilter = x => x.item_id === resetSelect;

                let purchaseIndex = this.user.data.purchases.findIndex(purchaseFilter);

                this.user.data.purchases.splice(purchaseIndex, 1);
                await this.user.save()

                await this.removeItemFromInv();
                return true;
            }

            case ItemTypes.Pet:
                console.log("🟩 Mascota!")
                console.log(this.item);

                let attacks;

                do {
                    attacks = [
                        this.#addPetAttack(PetAttacksType.Basic),
                        new Chance().bool({ likelihood: 80 }) ? this.#addPetAttack(PetAttacksType.Advanced) : this.#addPetAttack(PetAttacksType.Critical),
                        new Chance().bool({ likelihood: 80 }) ? this.#addPetAttack(PetAttacksType.Advanced) : this.#addPetAttack(PetAttacksType.Critical),
                        this.#addPetAttack(PetAttacksType.Ultimate)
                    ]
                } while (attacks.some(function (item, idx) {
                    return attacks.indexOf(item) != idx
                }))

                let newpet = {
                    name: new Chance().name({ nationality: "en" }).split(" ")[0],
                    shopId: this.item.id,
                    stats: Object.assign({}, this.item.stats, {
                        hunger: new Chance().integer({ min: 0, max: 25 })
                    }),
                    attacks,
                    id: FindNewId(await Users.find(), "data.pets", "id")
                }

                // Crear mascota
                this.user.data.pets.push(newpet)
                await this.user.save();
                await this.removeItemFromInv();
                return true;
            case ItemTypes.PetStatsModifier:
                console.log("🟩 Estadísticas de mascota!");

                // hacer elegir a qué mascota aplicar
                const pets = this.user.data.pets;

                const row = new ActionRowBuilder()
                const selector = new StringSelectMenuBuilder()
                    .setCustomId("modifyPetStats")
                    .setPlaceholder("¿En cuál mascota quieres usar este item?");

                for (const pet of pets) {
                    selector.addOptions({ label: pet.name, description: `❤️: ${pet.stats.hp} / 🍗: ${pet.stats.hunger}`, value: String(pet.id) })
                }

                row.addComponents(selector)

                selector.addOptions({ label: "Cancelar", value: "cancel", emoji: this.interaction.client.Emojis.Cross })

                await this.interaction.editReply({ components: [row] });

                let filter = (i) => i.isStringSelectMenu() && i.customId === "modifyPetStats" && i.user.id === this.interaction.user.id;
                let collector = await new Collector(this.interaction, { filter, max: 1, wait: true }).wait();

                if (!collector || collector.values[0] === "cancel") {
                    try {
                        await this.interaction.editReply({ embeds: [this.canceled], components: [] });
                    } catch (err) {
                        console.error("🔴 %s", err);
                    }
                    return false
                }

                let petId = Number(collector.values[0]);
                const pet = await new Pet(this.interaction, petId).build(this.doc, this.user);

                if (this.item.stats.hp >= 0) pet.changeHp(this.item.stats.hp)
                if (this.item.stats.hunger >= 0) pet.changeHunger(-this.item.stats.hunger)

                await pet.save();
                await this.removeItemFromInv();
                return true;

            case ItemTypes.EXTTS:
                console.log("🟩 EX TTS!");

                const ttsRow = new ActionRowBuilder()
                    .setComponents(
                        new ButtonBuilder()
                            .setEmoji("🗣️")
                            .setCustomId("ttsInteractionCreator")
                            .setStyle(ButtonStyle.Primary)
                    )
                if (this.user.isBannedFrom(ModuleBans.EXShopTTS)) {
                    await new ModuleBannedError(this.interaction).send()
                    return false;
                }

                let follow = await this.interaction.editReply({
                    embeds: [
                        new Embed()
                            .defDesc(`### ${this.interaction.member}, usa el botón de abajo para usar el TTS. Tendrás **5 minutos** para escribir a partir de que pulses el botón.
-# Tienes 1 minuto para presionar el botón antes de que se cancele el uso.`)
                            .defColor(Colores.nocolor)
                    ],
                    components: [ttsRow]
                });

                let ttsInteraction = await new Collector(this.interaction, {
                    filter: CreateInteractionFilter(this.interaction, follow, this.interaction.user),
                    time: ms("1m"),
                    wait: true
                }, true, false).onEnd(() => {
                    ttsRow.components.forEach(c => c.setDisabled());
                    this.interaction.editReply({ components: [ttsRow] });
                }).handle().wait(() => {
                    this.interaction.deleteReply();
                });

                if (!ttsInteraction) return false;

                await new Modal(ttsInteraction)
                    .defId("ttsInput")
                    .defTitle("TTS")
                    .addInput({ id: "tts", label: "¿Qué quieres decir?", placeholder: "Exprésate...", style: TextInputStyle.Paragraph, req: true, min: 1, max: 500 })
                    .show();

                let c = await ttsInteraction.awaitModalSubmit({
                    filter: (i) => i.customId === "ttsInput" && i.user.id === this.interaction.user.id,
                    time: ms("5m")
                }).catch(async err => {
                    if (err.code === DiscordjsErrorCodes.InteractionCollectorError) await this.interaction.deleteReply();
                    else throw err;
                });
                if (!c) break;
                await c.deferUpdate();
                ttsData = new Modal(c).read();

            case ItemTypes.EXMedia:
            case ItemTypes.EXKeyboard:
            case ItemTypes.EXTTS:
                console.log("🟩 EX Item!");
                const cooldowns = this.shop.cooldowns.filter(x => x.item_id === this.item.id);

                // Existe información de un cooldown para este item
                const userCooldown = cooldowns.find(x => x.user_id === this.interaction.user.id);
                const globalCooldown = cooldowns.find(x => x.user_id === null);

                const hasIndividual = userCooldown && moment().isBefore(userCooldown.until);
                const hasGlobal = globalCooldown && moment().isBefore(globalCooldown.until);

                if (userCooldown && !hasIndividual)
                    this.shop.cooldowns.splice(this.shop.cooldowns.findIndex(x => x === userCooldown), 1);
                if (globalCooldown && !hasGlobal)
                    this.shop.cooldowns.splice(this.shop.cooldowns.findIndex(x => x === globalCooldown), 1);
                if (hasIndividual || hasGlobal) {
                    await this.interaction.editReply({
                        embeds: [
                            new ErrorEmbed()
                                .defDesc(`Podrás usar este item ${time(globalCooldown?.until ?? userCooldown?.until, "R")}.`)
                                .defFooter({ text: `Cooldown ${hasGlobal ? "GLOBAL" : "INDIVIDUAL"} de ${new HumanMs(this.item.use_info.external_info.delays[hasGlobal ? "global" : "individual"]).human}.`, icon: this.interaction.guild.iconURL() })
                        ]
                    })
                    return false;
                }

                try {
                    let q = await superagent
                        .post(`${process.env.API_ENDPOINT}/api/ws/item-use`)
                        .send({
                            type: itemType,
                            item: this.item,
                            tts: ttsData?.tts ?? null,
                            guild: this.interaction.guild,
                            user: this.interaction.member.toJSON()
                        })
                        .set("auth", jwt.sign({ jb: true }, process.env.TOKEN))

                    if (!q.body) throw new JeffreyBotError(this.interaction, "No hubo cliente a quien enviar la respuesta");

                    // Cooldowns
                    const { global, individual } = this.item.use_info.external_info.delays;

                    if (individual > 0 && process.env.DEV != "TRUE" || (process.env.DEV === "TRUE" && !isDeveloper(this.interaction.member))) {
                        this.shop.cooldowns.push({
                            user_id: this.interaction.user.id,
                            until: moment().add(individual, "ms"),
                            item_id: this.item.id
                        })
                    }

                    if (global > 0 && process.env.DEV != "TRUE" || (process.env.DEV === "TRUE" && !isDeveloper(this.interaction.member))) {
                        this.shop.cooldowns.push({
                            until: moment().add(global, "ms"),
                            item_id: this.item.id
                        })
                    }

                    // Por alguna razón se necesita esto, no sé por qué, sólo debe ser así
                    this.shop.items[this.itemIndex]._id = this.item._id;
                    await this.shop.save();

                    if (process.env.DEV === "FALSE" || (process.env.DEV === "TRUE" && !isDeveloper(this.interaction.member)))
                        await this.removeItemFromInv();
                    return true;
                } catch (err) {
                    if (!(err instanceof JeffreyBotError)) console.error(err);

                    await this.interaction.editReply({
                        content: "",
                        embeds: [
                            new ErrorEmbed().defDesc(`No se encontró un Cliente conectado para usar este item.`)
                        ]
                    })
                    return false;
                }
            default:
                console.log("Item simple! %s", itemType)
                return await this.#activateItem();
        }
    }

    #addPetAttack(type) {
        let names = {
            base: [
                "Golpe", "Patada", "Rasguño", "Mordida", "Mareo", "Cabezazo"
            ],
            basic: [
                "Sencillx", "Leve", "Conformista", "Rápidx", "Suave", "Estándar", "Regular", "Simple", "Genéricx"
            ],
            critical: [
                "Certerx", "Fijx", "Conformista", "Rápidx", "Durx", "Letal", "Feroz"
            ],
            advanced: [
                "Firme", "Limpix", "Profesional", "Energéticx", "Intensx"
            ],
            ultimate: [
                "Final", "Críticx", "Infalible", "Poderosx", "Trascendental", "Apocalípticx", "Supremx", "Fulminante"
            ]
        }

        let prop = new Enum(PetAttacksType).translate(type, false).toLowerCase();
        let name = new Chance().pickone(names.base);
        name += " " + new Chance().pickone(names[prop]).replace("x", name.charAt(name.length - 1) === "a" ? "a" : "o")
        let cost;

        switch (type) {
            case PetAttacksType.Basic:
                cost = new Chance().integer({ min: 5, max: 10 });
                break;
            case PetAttacksType.Critical:
                cost = new Chance().integer({ min: 15, max: 20 });
                break;
            case PetAttacksType.Advanced:
                cost = new Chance().integer({ min: 10, max: 15 });
                break;
            case PetAttacksType.Ultimate:
                cost = new Chance().integer({ min: 20, max: 40 });
                break;
        }

        return {
            name,
            cost,
            type
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

        const willBenefit = await WillBenefit(this.member, [this.boost_objetive, BoostObjetives.All])
        if (willBenefit && (this.item.use_info.effect === ItemEffects.Positive || !this.isDarkShop)) {
            console.log("🔴 Se beneficiaría aún más")
            this.hasboost.send().catch(e => console.error(e));;
            return false
        }
        try {
            if (this.isSub) {
                await Subscription(this.member, role?.id, {
                    type: this.boost_type,
                    objetive: this.boost_objetive,
                    value: this.boost_value,
                }, {
                    item_id: this.itemId,
                    shop_type: this.shopType
                }, this.duration, this.price, this.item.name);

            } else {
                // llamar la funcion para hacer un globaldata y dar el role con boost
                await LimitedTime(this.member, role?.id, this.duration, {
                    item_id: this.itemId,
                    shop_type: this.shopType
                }, this.boost_type, this.boost_objetive, this.boost_value);
            }
        } catch (err) {
            console.error("🔴", err);

            this.notfound.send().catch(e => console.error(e));
            return false;
        }
        this.removeItemFromInv()
        return true;
    }

    async #removeBoost() {
        if (!await this.#darkshopWork()) return false;

        let filtered = this.boost_objetive ? this.user.data.temp_roles.filter(x => x.special.objetive === this.boost_objetive) : this.user.data.temp_roles;
        const temprole = new Chance().pickone(filtered);

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

        this.removeItemFromInv()
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
            .defDesc(`**—** ¡**${this.interaction.member.displayName}** se ha volado la Firewall  y ha usado el item \`${this.item.name}\` en **${this.member.displayName}**!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.member.user.username}`, timestamp: true });

        let success = new Embed()
            .defAuthor({ text: `Interacción`, icon: this.interaction.client.EmojisObject.DarkShop.url })
            .defDesc(`**—** ¡**${this.interaction.member.displayName}** ha usado el item \`${this.item.name}\` en **${this.member.displayName}**!`)
            .defColor(Colores.negro)
            .defFooter({ text: `${this.item.name} para ${this.member.user.username}`, timestamp: true });

        let fail = new Embed()
            .defAuthor({ text: `Interacción`, icon: this.interaction.client.EmojisObject.DarkShop.url })
            .defDesc(`**—** ¡**${this.interaction.member.displayName}** ha querido usar el item \`${this.item.name}\` en **${this.member.displayName}** pero NO HA FUNCIONADO!`)
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
            let skip = this.user.hasItem(skipFirewallItem.id, ShopTypes.DarkShop) && new Chance().bool({ likelihood: this.doc.settings.quantities.percentages.skipfirewall })

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
                dsEvents?.send({ content: `**${this.interaction.user.username}** ➡️ **${this.member}**.`, embeds: [fail] }).catch(err => {
                    console.error("🔴 %s", err);
                });

                await this.removeItemFromInv() // como es fallido, no llega al codigo base para que se elimine el item
                return false;
            } else { // se salta la firewall
                console.log("🟢 Se ha saltado la Firewall")
                dsEvents?.send({ content: `**${this.interaction.user.username}** ➡️ **${this.member}**.`, embeds: [skipped] }).catch(err => {
                    console.error("🔴 %s", err);
                });
                return true
            }
        } else { // no tiene firewall
            if (this.victim.economy.global.level >= this.doc.settings.quantities.darkshop.level) {
                dsEvents?.send({ content: `**${this.interaction.user.username}** ➡️ **${this.member}**.`, embeds: [success] }).catch(err => {
                    console.error("🔴 %s", err);
                });
                return true
            } else { // ni siquiera es parte de la red de la darkshop
                dsEvents?.send({ content: `**${this.interaction.user.username}** ➡️ **${this.member}**.`, embeds: [fail] }).catch(err => {
                    console.error("🔴 %s", err);
                });

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