const mongoose = require('mongoose')
const moment = require("moment-timezone")

const HumanMs = require("../../src/utils/HumanMs")
const { time } = require('discord.js')
const { RequirementType } = require('../../src/utils/Enums')

const Schema = new mongoose.Schema({
    guild_id: { type: String, required: true },
    user_id: { type: String, required: true },
    warns: [
        {
            rule_id: { type: Number },
            madeTicket: { type: Boolean, default: false },
            proof: { type: String, default: null },
            date: { type: Date, default: () => { return new Date() } },
            id: { type: Number, sparse: true }
        }
    ],
    softwarns: [
        {
            rule_id: { type: Number },
            madeTicket: { type: Boolean, default: false },
            proof: { type: String, default: null },
            date: { type: Date, default: () => { return new Date() } },
            id: { type: Number, sparse: true }
        }
    ],
    data: {
        isBanned: {
            bugreports: { type: Boolean, required: true, default: false },
            communitypolls: { type: Boolean, required: true, default: false },
            polls: { type: Boolean, required: true, default: false },
            suggestions: { type: Boolean, required: true, default: false },
            customrole: { type: Boolean, required: true, default: false },
            tickets: { type: Boolean, required: true, default: false },
            events: [ // eventos
                {
                    event_name: { type: String },
                    isBanned: { type: Boolean, default: false }
                }
            ]
        },
        purchases: [ // para el interés
            {
                isDarkShop: { type: Boolean, required: true, default: false },
                item_id: { type: Number, required: true },
                quantity: { type: Number, required: true }
            }
        ],
        inventory: [ // items comprados que no se han usado
            {
                isDarkShop: { type: Boolean, required: true, default: false },
                item_id: { type: Number, required: true },
                use_id: { type: Number, required: true, sparse: true },
                active: { type: Boolean, required: true, default: false },
                active_since: { type: Date, default: null }
            }
        ],
        customrole: { type: String, required: true, default: "0" },
        lastGained: {
            exp: { type: Number },
            currency: { type: Number }
        },
        unlockedVaults: { type: Array },
        birthday: {
            day: { type: Number, default: null },
            month: { type: Number, default: null },
            locked: { type: Boolean, default: false },
            locked_since: { type: Date, default: null }
        },
        birthday_reminders: [
            {
                id: { type: String, required: true },
                reminded: { type: Boolean, default: false, required: true }
            }
        ],
        backup_roles: { type: Array },
        temp_roles: [
            {
                role_id: { type: String },
                active_until: { type: Date, required: true },
                special: {
                    type: { type: Number, default: null },
                    objetive: { type: Number, default: null },
                    value: { type: Number, default: null },
                    disabled: { type: Boolean, default: false }
                },
                isSub: { type: Boolean, required: true, default: false },
                sub_info: {
                    price: { type: Number },
                    name: { type: String },
                    isCancelled: { type: Boolean }
                }
            }
        ],
        cooldowns: {
            coins: { type: Date, default: null },
            chat_rewards: { type: Date, default: null },
            rep: { type: Date, default: null },
            claim_rep: { type: Date, default: null },
            roulette: { type: Date, default: null },
            blackjack: { type: Date, default: null },
            currency_to_exp: { type: Date, default: null },
            inflation_prediction: { type: Date, default: null },
            rob: { type: Date, default: null },
        },
        counts: { // all time
            roulette: { type: Number, default: 0 },
            blackjack: { type: Number, default: 0 },
            normal_currency: {
                type: Number, default: function () {
                    if (this.economy.global.currency) return this.economy.global.currency
                    return 0
                }
            },
            warns: {
                type: Number, default: function () {
                    if (this.warns) return this.warns.length
                    return 0
                }
            }
        }
    },
    economy: {
        global: {
            exp: { type: Number, required: true, default: 0, integer: true },
            level: { type: Number, required: true, default: 0, integer: true },
            reputation: { type: Number, required: true, default: 0, integer: true },
            currency: { type: Number, required: true, default: 0, integer: true }
        },
        dark: {
            currency: { type: Number, default: 0, integer: true },
            accuracy: {
                type: Number, default: () => {
                    return Number((Math.random() * 10).toFixed(1))
                }
            },
            until: { type: Date, default: null }
        }
    }
})

Schema.pre("save", function () {
    this.economy.global.currency = Math.round(this.economy.global.currency);
    this.economy.global.exp = Math.round(this.economy.global.exp);

    this.economy.dark.currency = Math.round(this.economy.dark.currency);

    this.data.counts.normal_currency = Math.round(this.data.counts.normal_currency);

    if (this.economy.global.currency) {
        let obj = this.economy.toObject();
        delete obj.global.jeffros;

        this.economy = obj;
    }

    if (this.economy.dark.currency) {
        let obj = this.economy.toObject();
        delete obj.dark.darkjeffro;

        this.economy = obj;
    }

    if (this.economy.dark.accuracy > 80) this.economy.dark.accuracy = 80;

    // Corregir nivel actual
    const expNow = this.economy.global.exp;
    let realLvl = Math.floor(- (25 - Math.sqrt(5 * (2 * expNow - 75))) / 10); // solved: 10 * (level ** 2) + 50 * level + 100
    const nextLevel = this.getNextLevelExp(realLvl)

    if (expNow >= nextLevel) realLvl++;
    if (realLvl <= 0 || isNaN(realLvl)) realLvl = 0;

    // Cambio de nivel
    if (this.economy.global.level != realLvl) mongoose.models.Guilds.getOrCreate(this.guild_id).then(doc => doc.manageLevelUp(realLvl, this));

    this.economy.global.level = realLvl // la ecuacion se toma como si la exp ahora fuese la exp necesaria para el siguiente nivel

})

Schema.static("getOrCreate", async function ({ user_id, guild_id }) {
    return await this.findOne({
        user_id: user_id,
        guild_id: guild_id
    }) ?? await new this({
        user_id: user_id,
        guild_id: guild_id
    }).save();
})

Schema.method("getNextLevelExp", function (level = null) {
    if (level === null) level = this.economy.global.level;
    else if (level < 0) level = 0;

    return 10 * (level ** 2) + 50 * level + 100;
})

Schema.method("addCount", async function (module, count = 1, save = true) {
    this.data.counts[module] += count;
    if (save) return await this.save();
})

Schema.method("addCurrency", async function (count) {
    this.economy.global.currency += count;
    this.data.counts.normal_currency += count;
    return await this.save();
})

Schema.method("addRep", async function (count) {
    this.economy.global.reputation += count;
    return await this.save();
})

Schema.method("hasItem", function (itemId, darkshop = false) {
    let x = false;
    this.data.inventory.forEach(item => {
        if (item.item_id === itemId && item.isDarkShop === darkshop) x = true;
    });

    return x
})

Schema.method("canBuy", function (price, darkshop = false) {
    if (!darkshop) return this.economy.global.currency >= price
    return this.economy.dark.currency >= price
})

Schema.method("parseCurrency", function (Emojis, darkshop = false) {
    if (!darkshop) return `**${Emojis.Currency}${this.economy.global.currency.toLocaleString("es-CO")}**`;
    return `**${Emojis.DarkCurrency}${this.economy.dark.currency.toLocaleString("es-CO")}**`;
})

Schema.method("isBannedFrom", function (module) {
    return this.data.isBanned[module];
})

Schema.method("toggleBan", async function (module) {
    let info = this.data.isBanned[module]

    if (info) this.data.isBanned[module] = false
    else this.data.isBanned[module] = true;

    await this.save();

    return this.data.isBanned[module];
})

/**
 * - (true) SAVE: GUARDA EL DOCUMENTO USER
 * - (true) CHECK: REVISA SI EL USUARIO TIENE COOLDOWN
 * - (false) INFO: SOLO SE OBTIENE INFO, NO SE CAMBIA NADA EN LA BASE DE DATOS
 * - (false) INSTANT: SIEMPRE DEVUELVE LA INFO DEL COOLDOWN, COMO SI SIEMPRE HUBIESE TENIDO EL COOLDOWN
 * - (false) PRECISE: NO SE AGREGA EL COOLDOWN, SINO QUE SE ESTABLECE LA FECHA CUANDO SE TERMINA EL COOLDOWN EN LA BASE DE DATOS
 *                    REQUIERE "FORCE_COOLDOWN"
 * - (false) LOG: CONSOLE.LOG
 */
Schema.method("cooldown", async function (modulo, options = { force_cooldown: null, save: true, check: true, info: false, instant: false, precise: false, log: false }) {
    let { force_cooldown, save, check, info, instant, precise, log } = options
    const doc = await mongoose.models.Guilds.getOrCreate(this.guild_id)
    const cooldownInfo = !force_cooldown ? doc.getCooldown(modulo) : null;

    const baseCooldown = cooldownInfo?.base;
    let modifiers = cooldownInfo?.modifiers;

    const LevelModif = modifiers?.filter(x => x.req_type === RequirementType.Level).sort((a, b) => b.requirement - a.requirement)
    const RoleModif = modifiers?.filter(x => x.req_type === RequirementType.Role).sort((a, b) => a.multiplier - b.multiplier)

    if (RoleModif?.length > 0) {
        const client = require("../../index");

        const guild = client.guilds.cache.get(this.guild_id);
        const member = guild.members.cache.get(this.user_id);

        roles = member.roles.cache;
    }

    const selectedLevelModif = LevelModif?.find(x => this.economy.global.level >= x.requirement);
    const selectedRoleModif = typeof roles != "undefined" ? RoleModif?.find(x => {
        if (roles.get(x.requirement)) return x
    }) : null;

    let modifier = selectedLevelModif ?? selectedRoleModif ?? null;
    if (selectedRoleModif?.multiplier < selectedLevelModif?.multiplier) modifier = selectedRoleModif
    else if (selectedLevelModif?.multiplier < selectedRoleModif?.multiplier) modifier = selectedLevelModif

    const cooldown = force_cooldown ?? (modifier ? baseCooldown * modifier?.multiplier : baseCooldown);

    if (check === undefined) check = true;
    if (save === undefined) save = true;
    if (precise === undefined) precise = false;
    if (log === undefined) log = false;

    if (!info && log) console.log("⚠️ Se está usando el cooldown %s", precise ? cooldown : new HumanMs(cooldown).human)

    if (this.data.cooldowns[modulo] && check) {
        let timer = this.data.cooldowns[modulo];
        let text = new HumanMs(moment(timer)).left();

        if (!moment().isAfter(moment(timer)))
            return { mention: time(timer, "R"), timestamp: timer, text }
        /* let timer = this.data.cooldowns[modulo];
        let toCheck = moment(timer).add(cooldown, "ms");
        let text = new HumanMs(toCheck).left(); */
    }

    if (info && !check) return cooldown;
    if (info) return;

    let c = precise ? cooldown : moment().add(cooldown, "ms").toDate()
    let text = new HumanMs(moment(c)).left();

    this.data.cooldowns[modulo] = c;
    if (save) this.save();
    else if (log) console.log("⚠️ NO se guardó el cooldown inmediatamente")

    return instant ? { mention: time(c, "R"), timestamp: c, text } : null
})

Schema.method("delCooldown", function (modulo, options = { save: true }) {
    let { save } = options

    this.data.cooldowns[modulo] = null
    if (save) this.save();
    else console.log("⚠️ NO se guardó el cooldown inmediatamente")
})

Schema.method("getBoosts", function () {
    return this.data.temp_roles.filter(x => x.special.type);
})

Schema.method("getBirthdayReminders", function () {
    return this.data.birthday_reminders;
})

Schema.method("hasReminderFor", function (id) {
    return this.getBirthdayReminders().find(x => x.id === id) ? true : false;
})

Schema.method("isBirthday", function () {
    let bdDay = this.data.birthday.day;
    let bdMonth = this.data.birthday.month;

    let now = new Date();
    let actualDay = now.getDate();
    let actualMonth = now.getMonth();

    if ((actualDay === bdDay) && (actualMonth === bdMonth) && this.data.birthday.locked) return true;
    return false;
})

module.exports = mongoose.model('Users', Schema)