const { Collection } = require('discord.js');
const mongoose = require('mongoose');
const ms = require("ms");

const { ModifierType } = require('../../src/utils/Enums');

const { integerValidator, positiveValidator, positiveWithZeroValidator } = require('../Validators');

const Schema = mongoose.Schema;

const modifiers = {
    type: { type: Number, required: true },
    module: { type: String, required: true },
    multiplier: { type: Number, required: true },
    requirement: { type: Schema.Types.Mixed, required: true },
    req_type: { type: Number, required: true },
    id: { type: Number, sparse: true }
}

const GuildSchema = new Schema({
    guild_id: { type: String, required: true, unique: true },
    data: {
        tickets: [
            {
                type: { type: String, required: true },
                created_by: { type: String, required: true },
                channel_id: { type: String, required: true },
                message_id: { type: String, required: true },
                creation_date: { type: Date, default: () => new Date() },
                last_reminded: { type: Date, default: null },
                end_date: { type: Date, default: null },
                end_reason: { type: String, default: null },
                ended_by: { type: String, default: null },
                id: { type: Number, sparse: true }
            }
        ],
        suggestions: [
            {
                user_id: { type: String, required: true },
                channel_id: { type: String, required: true },
                message_id: { type: String, required: true },
                creation_date: { type: Date, default: () => new Date() },
                last_reminded: { type: Date, default: null },
                suggestion: { type: String, required: true },
                accepted: { type: Boolean, default: null },
                reason: { type: String, default: null },
                id: { type: Number, sparse: true }
            }
        ],
        bets: [
            {
                title: { type: String, required: true },
                closes_in: { type: Date, required: true },
                closed: { type: Boolean, default: false },
                options: [
                    {
                        name: String,
                        emoji: String,
                        square: String,
                        betting: [
                            { user_id: String, quantity: Number }
                        ]
                    }
                ],
                message_id: { type: String, required: true }
            }
        ],
        autoroles: [
            {
                name: { type: String, required: true },
                role_id: { type: String, required: true },
                emote: { type: String },
                guild_emote: { type: String, default: null },
                toggle_group: { type: Number, default: null },
                id: { type: Number, sparse: true }
            }
        ],
        togglegroups: [
            {
                group_name: { type: String, required: true },
                id: { type: Number, sparse: true }
            }
        ],
        vault_codes: [
            {
                code: { type: String, required: true },
                reward: { type: Number, required: true, default: 100 },
                hints: [
                    { type: String, required: true }
                ],
                id: { type: Number, required: true, sparse: true }
            }
        ],
        rules: [
            {
                name: { type: String, required: true },
                desc: { type: String },
                expl: { type: String, required: true },
                position: { type: Number },
                id: { type: Number, sparse: true }
            }
        ],
        keys: [
            {
                config: {
                    maxuses: { type: Number, required: true, default: 1 },
                    used: { type: Number, required: true, default: 0 },
                    usedBy: { type: Array }
                },
                reward: {
                    type: { type: Number, required: true },
                    boost_type: { type: Number, default: null },
                    boost_value: { type: Number, default: null },
                    boost_objetive: { type: Number, default: null },
                    value: { type: String, required: true },
                    duration: { type: Number }
                },
                code: { type: String, required: true },
                id: { type: Number, required: true, sparse: true }
            }
        ],
        locked_channels: [
            {
                channel_id: { type: String, required: true },
                perms: [
                    {
                        id: { type: String, required: true },
                        denied: [{ type: String }],
                        allowed: [{ type: String }],
                        type: { type: Number }
                    }
                ]
            }
        ],
        social_notifications: {
            youtube: {
                videos: [],
                shorts: []
            },
            twitch: []
        },
        average_currency: { type: Number, default: 0 },
        bank: {
            interests: { type: Number, default: 0, validate: [integerValidator, positiveWithZeroValidator] },
            gambling: { type: Number, default: 0, validate: [integerValidator, positiveWithZeroValidator] },
            user_actions: { type: Number, default: 0, validate: [integerValidator, positiveWithZeroValidator] },
            others: { type: Number, default: 0, validate: [integerValidator, positiveWithZeroValidator] }
        }
    },
    settings: {
        active_modules: {
            functions: {
                suggestions: { type: Boolean, default: false },
                tickets: { type: Boolean, default: false },
                logs: { type: Boolean, default: true },
                birthdays: { type: Boolean, default: false },
                darkshop: { type: Boolean, default: false },
                rep_to_currency: { type: Boolean, default: false },
                currency_to_exp: { type: Boolean, default: false },
                staff_reminders: { type: Boolean, default: true }
            },
            logs: {
                guild: {
                    messageDelete: { type: Boolean, default: false },
                    messageUpdate: { type: Boolean, default: false },
                    // TODO: Agregar más logs
                },
                moderation: {
                    warns: { type: Boolean, default: true },
                    softwarns: { type: Boolean, default: false },
                    pardons: { type: Boolean, default: true },
                    bans: { type: Boolean, default: true },
                    timeouts: { type: Boolean, default: true },
                    clears: { type: Boolean, default: true },
                    automod: { type: Boolean, default: true }
                },
                staff: {
                    tickets: { type: Boolean, default: true },
                    settings: { type: Boolean, default: true },
                    errors: { type: Boolean, default: true },
                    automated_changes: { type: Boolean, default: true }
                },
                darkshop: {
                    sunday: { type: Boolean, default: true },
                    removed_currency: { type: Boolean, default: false }
                }
            },
            automoderation: {
                remove_links: { type: Boolean, default: false }
            }
        },
        autoroles: {
            channel_id: { type: String },
            message_id: { type: String },
            guild_id: { type: String },
        },
        quantities: {
            interest_days: {
                secured: { type: Number, default: 14, validate: [positiveWithZeroValidator, integerValidator] }
            },
            blackjack: {
                consecutive_wins: { type: Number, default: 5, validate: [positiveValidator, integerValidator] }
            },
            darkshop: {
                level: { type: Number, default: 5, validate: positiveWithZeroValidator },
                baseprice: { type: Number, default: 200, validate: [positiveValidator, integerValidator] }
            },
            currency_per_rep: { type: Number, default: 500, validate: [positiveValidator, integerValidator] },
            awards: {
                tier1: {
                    price: { type: Number, default: 100, validate: [positiveValidator, integerValidator] },
                    gift: { type: Number, default: 0, validate: [positiveWithZeroValidator, integerValidator] }
                },
                tier2: {
                    price: { type: Number, default: 500, validate: [positiveValidator, integerValidator] },
                    gift: { type: Number, default: 100, validate: [positiveWithZeroValidator, integerValidator] }
                },
                tier3: {
                    price: { type: Number, default: 1800, validate: [positiveValidator, integerValidator] },
                    gift: { type: Number, default: 700, validate: [positiveWithZeroValidator, integerValidator] }
                },
            },
            limits: {
                chat_rewards: {
                    exp: {
                        min: { type: Number, default: 5, validate: [positiveValidator, integerValidator] },
                        max: { type: Number, default: 35, validate: [positiveValidator, integerValidator] }
                    },
                    currency: {
                        min: { type: Number, default: 5, validate: [positiveValidator, integerValidator] },
                        max: { type: Number, default: 15, validate: [positiveValidator, integerValidator] }
                    }
                },
                currency: {
                    coins: {
                        min: { type: Number, default: 1, validate: [positiveValidator, integerValidator] },
                        max: { type: Number, default: 20, validate: [positiveValidator, integerValidator] }
                    },
                    rob: {
                        min: { type: Number, default: 40, validate: [positiveValidator, integerValidator]},
                        max: { type: Number, default: 100, validate: [positiveValidator, integerValidator]},
                    }
                },
                pets: {
                    hunger: {
                        min: { type: Number, default: 1, validate: [positiveValidator, integerValidator] },
                        max: { type: Number, default: 3, validate: [positiveValidator, integerValidator] },
                    }
                },
                bets: {
                    blackjack: {
                        min: { type: Number, default: 1000, validate: [positiveValidator, integerValidator] },
                        max: { type: Number, default: Infinity, validate: [positiveValidator] }
                    },
                    staff_bets: {
                        min: { type: Number, default: 10, validate: [positiveValidator, integerValidator] },
                        max: { type: Number, default: 1000, validate: [positiveValidator] }
                    }
                }
            },
            percentages: {
                interests: {
                    secured: { type: Number, default: 1, validate: positiveWithZeroValidator },
                },
                skipfirewall: { type: Number, default: 100, validate: positiveWithZeroValidator },
                pets: {
                    basic_unlocked: { type: Number, default: 5 },
                },
                limits: {
                    rob: {
                        success: {
                            min: { type: Number, default: 50, validate: [positiveValidator, integerValidator] },
                            max: { type: Number, default: 80, validate: [positiveValidator, integerValidator] }
                        },
                        fail: {
                            min: { type: Number, default: 20, validate: [positiveValidator, integerValidator] },
                            max: { type: Number, default: 40, validate: [positiveValidator, integerValidator] }
                        }
                    }
                }
            }
        },
        functions: {
            adjust: {
                shop: { type: Boolean, default: false },
                darkshop: { type: Boolean, default: false },
                coins: { type: Boolean, default: false },
                chat_rewards: { type: Boolean, default: false },
                claim_rep: { type: Boolean, default: false },
                roulette: { type: Boolean, default: false },
                staff_bets: { type: Boolean, default: false },
            },
            levels_deleteOldRole: { type: Boolean, default: false },
            save_roles_onleft: { type: Boolean, default: true },
            sug_remind: { type: Number, default: 7, validate: [positiveValidator, integerValidator] },
            ticket_remind: { type: Number, default: 7, validate: [positiveValidator, integerValidator] },
        },
        cooldowns: {
            coins: { type: String, default: "10m" },
            chat_rewards: { type: String, default: "1m" },
            rep: { type: String, default: "1d" },
            claim_rep: { type: String, default: "3h" },
            roulette: { type: String, default: "1d" },
            blackjack: { type: String, default: "5m" },
            currency_to_exp: { type: String, default: "1w" },
            rob: { type: String, default: "15m" },
        },
        modifiers: [modifiers]
    },
    roles: { // id de roles
        admins: { type: Array, default: [] },
        staffs: { type: Array, default: [] },
        users: { type: Array, default: [] },
        bots: { type: Array, default: [] },
        levels: [
            {
                level: { type: Number, required: true },
                roles: { type: Array, required: true }
            }
        ],
        birthday: { type: String },
        suggester_role: { type: String },
        announcements: {
            youtube: {
                videos: String,
                shorts: String,
            },
            twitch: String,
            darkshop: String,
            polls: String,
            bets: String
        }
    },
    channels: {
        logs: {
            guild_logs: { type: String },
            moderation_logs: { type: String },
            staff_logs: { type: String },
            suggestions: { type: String },
            user_left: { type: String },
            darkshop_logs: { type: String }
        },
        chat_rewards: [
            {
                channel: { type: String, required: true },
                multiplier: { type: Number, default: 1 }
            }
        ],
        notifier: {
            youtube_notif: { type: String },
            twitter_notif: { type: String },
            twitch_notif: { type: String },
        },
        general: {
            rules: { type: String },
            information: { type: String },
            faq: { type: String },
            announcements: { type: String },
            halloffame: { type: String },
        }
    },
    categories: {
        tickets: { type: String }
    },
    emojis: {
        economy: {
            currency: { type: String, default: null },
            dark_currency: { type: String, default: null }
        }
    }
});

GuildSchema.pre("save", function () {
    if (this.settings.functions.adjust) {
        let obj = this.settings.functions.toObject();
        delete obj.adjust_shop, obj.adjust_darkshop, obj.adjust_coins;

        this.settings.functions = obj;
    }
})

GuildSchema.static("getWork", async function (id) {
    return await this.findOne({
        guild_id: id
    }) ?? await new this({
        guild_id: id
    }).save();
})

GuildSchema.static("getById", async function (id) {
    return await this.findOne({ guild_id: id })
});

GuildSchema.method("checkStaff", function(member) {
    return member.roles.cache.hasAny(...this.getStaffs());
})

GuildSchema.method("manageLevelUp", async function (level, userDoc) {
    const client = require("../../index");
    const guild = await client.guilds.fetch(this.guild_id);
    const member = await guild.members.fetch(userDoc.user_id);

    const roles = new Collection();
    const toRemoveRoles = new Collection();

    const rewardsList = this.roles.levels.sort((a, b) => b.level - a.level);

    const reward = rewardsList.find(x => level >= x.level);
    if (!reward) return
    for await (const roleId of reward.roles) {
        roles.set(roleId, await guild.roles.fetch(roleId))
    }

    if (this.settings.functions.levels_deleteOldRole) { // Se eliminan las recompensas viejas
        const rewardsToRemove = rewardsList.filter(x => x != reward);

        for (const reward of rewardsToRemove) {
            for (const roleId of reward.roles) {
                toRemoveRoles.set(roleId, guild.roles.cache.get(roleId))
            }
        }
    } else {
        // todo lo que pueda ser agregado como recompensa (sincronizarlos)
        let reversedList = rewardsList.reverse();
        let index = reversedList.findIndex(x => x === reward);

        reversedList.splice(index);
        reversedList.filter(x => x != reward);

        for (const reward of reversedList) {
            for (const roleId of reward.roles) {
                roles.set(roleId, guild.roles.cache.get(roleId))
            }
        }
    }

    if (!member.roles.cache.hasAll(...roles.keys())) await member.roles.add(roles).catch(err => console.log(err)); // Si le falta algun role, agregarlo
    if (toRemoveRoles.size > 0) member.roles.remove(toRemoveRoles).catch(err => console.log(err)); // Si hay roles para eliminar, hacerlo
})

GuildSchema.method("getCooldown", function (modulo, toString = false) {
    const base = this.settings.cooldowns[modulo];
    const modifiers = this.settings.modifiers.filter(x => x.module === modulo && x.type === ModifierType.Cooldown);

    if (!base) return null

    return toString ? { base, modifiers } : { base: ms(base), modifiers };
})

GuildSchema.method("getMultipliers", function (modulo) {
    return this.settings.modifiers.filter(x => x.module === modulo && x.type === ModifierType.Multiplier);
})

GuildSchema.method("getVaultCode", function (code) {
    return this.data.vault_codes.find(x => x.code === code);
})

GuildSchema.method("getVaultCodeById", function (id) {
    return this.data.vault_codes.find(x => x.id === id);
})

GuildSchema.method("getAutoRole", function (id) {
    return this.data.autoroles.find(x => x.id === id);
})

GuildSchema.method("getOrCreateToggleGroup", function (id) {
    return this.data.togglegroups.find(x => x.id === id) ?? this.data.togglegroups.push({ group_name: `Grupo ${id}`, id });
})

GuildSchema.method("getBankValue", function (modulo = null) {
    if (modulo) return this.data.bank[modulo]

    let s = 0;
    for (const prop of this.data.bank) {
        s += this.data.bank[prop];
    }

    return s
})

GuildSchema.method("addToBank", async function (count, modulo, save = true) {
    this.data.bank[modulo] += count
    if (save) this.save();

    return this
})

GuildSchema.method("addAutoRole", async function (name, role_id, emoteInfo, id) {
    let emote = emoteInfo;
    let guild_emote = null;

    if (emote && typeof emote != "string") {
        emote = emoteInfo.id;
        guild_emote = emoteInfo.guild?.id;
    }

    this.data.autoroles.push({
        guild_emote,
        emote,
        name,
        role_id,
        id
    });
    return await this.save();
});

GuildSchema.method("getAdmins", function () {
    return this.roles.admins
});

GuildSchema.method("getStaffs", function () {
    return this.roles.staffs
});

GuildSchema.method("getUsers", function () {
    return this.roles.users
});

GuildSchema.method("getBots", function () {
    return this.roles.bots
});

GuildSchema.method("getChannel", function (query) {
    let general = this.channels;
    const q = query.split(".");

    if (q.length >= 1) {
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];

            general = general[queryQ]
        }
    }

    return general ?? null;
})

GuildSchema.method("getCategory", function (query) {
    let general = this.categories;
    const q = query.split(".");

    if (q.length >= 1) {
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];

            general = general[queryQ]
        }
    }

    return general ?? null;
})

GuildSchema.method("getLogChannel", function (module) {
    return this.getChannel("logs." + module);
})

GuildSchema.method("getRole", function (query) {
    let general = this.roles;
    const q = query.split(".");

    if (q.length >= 1) {
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];

            general = general[queryQ]
        }
    }

    return general ?? null;
})

GuildSchema.method("moduleIsActive", function (query, initial = this.settings.active_modules) {
    let general = initial;
    const q = query.split(".");

    if (q.length >= 1) {
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];

            general = general[queryQ]
        }
    }

    return general;
})

GuildSchema.method("getEmoji", function (query) {
    let general = this.emojis;
    const q = query.split(".");

    if (q.length >= 1) {
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];

            general = general[queryQ]
        }
    }

    return general;
})

GuildSchema.method("toAdjust", function (query) {
    return this.settings.functions.adjust[query];
})

module.exports = mongoose.model('Guilds', GuildSchema);