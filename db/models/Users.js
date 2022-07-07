const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserSchema = new Schema({
    guild_id: { type: String, required: true },
    user_id: { type: String, required: true },
    warns: [
        {
            rule_id: { type: Number },
            madeTicket: { type: Boolean, default: false },
            proof: { type: String, default: "na" },
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
                isDarkShop: { type: Boolean, required: true, default: false},
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
                role_id : { type: String, required: true },
                active_since: { type: Date, required: true },
                duration: { type: Number, required: true },
                special: {
                    type: { type: String, default: null },
                    objetive: { type: String, default: null },
                    value: { type: Number, default: null }
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
        }
    },
    economy: {
        global: {
            exp: { type: Number, required: true, default: 0 },
            level: { type: Number, required: true, default: 0},
            reputation: { type: Number, required: true, default: 0 },
            jeffros: { type: Number, required: true, default: 0 }
        },
        dark: {
            darkjeffros: { type: Number },
            accuracy: { type: Number },
            duration: { type: Number },
            dj_since: { type: Date }
        }
    }
})

UserSchema.static("getOrCreate", async function({user_id, guild_id}) {
    return this.findOne({
        user_id: user_id,
        guild_id: guild_id
    }) ?? new this({
        user_id: user_id,
        guild_id: guild_id
    }).save();
})

module.exports = mongoose.model('Users', UserSchema)