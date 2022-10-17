const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
    guild_id: { type: String, required: true },
    user_id: { type: String, required: true },
    warns: [
        {
            rule_id: { type: Number },
            madeTicket: { type: Boolean, default: false },
            proof: { type: String, default: null },
            id: { type: Number, sparse: true }
        }
    ],
    softwarns: [
        {
            rule_id: { type: Number },
            madeTicket: { type: Boolean, default: false },
            proof: { type: String, default: "na" },
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
        lastExpJeffros: {
            exp: { type: Number },
            jeffros: { type: Number }
        },
        unlockedVaults: { type: Array },
        birthday: {
            day: { type: Number, default: null },
            month: { type: String, default: null },
            locked: { type: Boolean, default: false },
            locked_since: { type: Date, default: null }
        },
        backup_roles: { type: Array },
        temp_roles: [
            {
                role_id: { type: String, required: true },
                active_since: { type: Date, required: true },
                duration: { type: Number, required: true },
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
            jeffros_exp: { type: Date, default: null },
            rep: { type: Date, default: null }
        },
        counts: { // all time
            reps: {
                type: Number, default: function () {
                    if (this.economy.global.reputation) return this.economy.global.reputation
                    return 0
                }
            },
            jeffros: {
                type: Number, default: function () {
                    if (this.economy.global.jeffros) return this.economy.global.jeffros
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
            exp: { type: Number, required: true, default: 0 },
            level: { type: Number, required: true, default: 0 },
            reputation: { type: Number, required: true, default: 0 },
            jeffros: { type: Number, required: true, default: 0 }
        },
        dark: {
            darkjeffros: { type: Number, default: 0 },
            accuracy: { type: Number, default: null },
            duration: { type: Number, default: null },
            dj_since: { type: Date, default: null}
        }
    }
})

Schema.static("getOrCreate", async function ({ user_id, guild_id }) {
    return this.findOne({
        user_id: user_id,
        guild_id: guild_id
    }) ?? new this({
        user_id: user_id,
        guild_id: guild_id
    }).save();
})

Schema.method("addJeffros", async function (count) {
    this.economy.global.jeffros += count;
    this.data.counts.jeffros += count;
    return await this.save();
})

Schema.method("addRep", async function (count) {
    this.economy.global.reputation += count;
    this.data.counts.reps += count;
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
    if(!darkshop) return this.economy.global.jeffros >= price
    return this.economy.dark.darkjeffros >= price
})

Schema.method("parseJeffros", function (Emojis, darkshop = false) {
    if(!darkshop) return `**${Emojis.Jeffros}${this.economy.global.jeffros.toLocaleString("es-CO")}**`;
    return `**${Emojis.DarkJeffros}${this.economy.dark.darkjeffros.toLocaleString("es-CO")}**`;
})

Schema.method("isBannedFrom", function(module){
    return this.data.isBanned[module];
})

Schema.method("toggleBan", async function(module){
    let info = this.data.isBanned[module]

    if(info) this.data.isBanned[module] = false
    else this.data.isBanned[module] = true;

    await this.save();

    return this.data.isBanned[module];
})

module.exports = mongoose.model('Users', Schema)