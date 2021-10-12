const { User } = require('discord.js')
const mongoose = require('mongoose')

const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId

const UserSchema = new Schema({
    guild_id: { type: String, required: true },
    user_id: { type: String, required: true },
    warns: [
        {
            rule_id: { type: Number },
            proof: { type: String, default: "na" },
            id: { type: Number, sparse: true }
        }
    ],
    softwarns: [
        {
            rule_id: { type: Number },
            proof: { type: String, default: "na" },
            id: { type: Number, sparse: true }
        }
    ],
    data: {
        isBanned: {
            bugreports: { type: Boolean, required: true, default: false },
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
                active: { type: Boolean, required: true, default: false },
                active_since: { type: Date }
            }
        ],
        customrole: { type: String, required: true, default: "0" },
        lastExpJeffros: {
            exp: { type: Number },
            jeffros: { type: Number }
        },
        unlockedVaults: [
            {
                code_id: { type: Number, required: true }
            }
        ],
        birthday: {
            day: { type: Number, default: null },
            month: { type: Number, default: null },
            locked: { type: Boolean, default: false },
            locked_since: { type: Date, default: null }
        },
        backup_roles: [ // guardar roles cuando te salgas del server.
            {
                role_id: { type: String, required: true }
            }
        ],
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
        ]
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

module.exports = mongoose.model('User', UserSchema)