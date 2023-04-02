const { Collection, hyperlink, codeBlock } = require('discord.js');
const mongoose = require('mongoose');
const ms = require("ms");

const { ModifierType, ChannelModules, LogReasons } = require('../../src/utils/Enums');

const ErrorEmbed = require('../../src/utils/ErrorEmbed');

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
        autoroles: [
            {
                channel_id: { type: String, required: true },
                message_id: { type: String, required: true },
                guild_emote: { type: String, default: null },
                emote: { type: String, required: true },
                role_id: { type: String, required: true },
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
        ]
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
            blackjack_bet: { type: Number, default: 1000 },
            darkshop_level: { type: Number, default: 5 },
            percentage_skipfirewall: { type: Number, default: 100 },
            min_exp: { type: Number, default: 5, integer: true },
            max_exp: { type: Number, default: 35, integer: true },
            min_curr: { type: Number, default: 5, integer: true },
            max_curr: { type: Number, default: 15, integer: true },
            baseprice_darkshop: { type: Number, default: 200, integer: true },
            currency_per_rep: { type: Number, default: 500, integer: true },
            awards: {
                tier1: {
                    price: { type: Number, default: 100, integer: true },
                    gift: { type: Number, default: 0, integer: true }
                },
                tier2: {
                    price: { type: Number, default: 500, integer: true },
                    gift: { type: Number, default: 100, integer: true }
                },
                tier3: {
                    price: { type: Number, default: 1800, integer: true },
                    gift: { type: Number, default: 700, integer: true }
                },
            },
            rob: {
                percentage: { type: Number, default: 60 },
                min_success: { type: Number, default: 5 },
                max_success: { type: Number, default: 15 },
                min_fail: { type: Number, default: 10 },
                max_fail: { type: Number, default: 30 },
            }

        },
        functions: {
            adjust_shop: { type: Boolean, default: true },
            adjust_darkshop: { type: Boolean, default: true },
            levels_deleteOldRole: { type: Boolean, default: false },
            save_roles_onleft: { type: Boolean, default: true },
            sug_remind: { type: Number, default: 7, integer: true },
            ticket_remind: { type: Number, default: 7, integer: true },
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
        darkshop_news: { type: String },
        suggester_role: { type: String },
        notifications: {
            youtube: { type: String },
            youtube_shorts: { type: String },
            twitter: { type: String },
            twitch: { type: String }
        }
    },
    channels: {
        logs: {
            guild_logs: { type: String },
            moderation_logs: { type: String },
            staff_logs: { type: String },
            suggestions: { type: String },
            user_left: { type: String }
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
        },
        darkshop: {
            events: { type: String }
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

GuildSchema.static("getOrCreate", async function (id) {
    return await this.findOne({
        guild_id: id
    }) ?? await new this({
        guild_id: id
    }).save();
})

GuildSchema.static("getById", async function (id) {
    return await this.findOne({ guild_id: id })
});

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
    const modifiers = this.settings.modifiers.filter(x => x.module == modulo && x.type == ModifierType.Cooldown);

    return toString ? { base, modifiers } : { base: ms(base), modifiers };
})

GuildSchema.method("getMultipliers", function (modulo) {
    return this.settings.modifiers.filter(x => x.module == modulo && x.type === ModifierType.Multiplier);
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
    let q = this.data.togglegroups.find(x => x.id === id) ?? this.data.togglegroups.push({ group_name: `Grupo ${id}`, id });
    return q;
})

GuildSchema.method("addAutoRole", async function (emoteInfo, role_id, id) {
    let emote = emoteInfo;
    let guild_emote = null;
    let channel_id = this.settings.autoroles.channel_id;
    let message_id = this.settings.autoroles.message_id;

    if (typeof emote != "string") {
        emote = emoteInfo.id;
        guild_emote = emoteInfo.guild?.id;
    }

    let creatable = true;
    this.data.autoroles.forEach(auto => {
        let sameEmote = auto.emote === emote ? true : false;
        let sameRole = auto.role_id === role_id ? true : false;
        let sameMsg = auto.message_id === message_id ? true : false;

        creatable = sameMsg ?
            sameEmote || sameRole ? false : true
            : true;

        if (!creatable) return false;
    })

    if (!creatable) return null;

    this.data.autoroles.push({
        channel_id,
        message_id,
        guild_emote,
        emote,
        role_id,
        id
    });
    return await this.save();
});

GuildSchema.method("workerAddAutoRole", function (message, reaction, user) {
    const Log = require('../../src/utils/Log');

    const reactions = message.reactions.cache;
    const guild = message.guild;
    const reactor = guild.members.cache.get(user.id);
    const autoroles = this.data.autoroles;
    let emoji = reaction.emoji.id ?? reaction.emoji.name

    const autorole = autoroles.find(x =>
        x.emote === emoji &&
        x.message_id === message.id
    )

    if (!autorole) {
        if (autoroles.find(x => x.message_id === message.id)) {
            return reactions.find(x => x.emoji === reaction.emoji).remove(reactor);
        }

        return;
    }

    const role = guild.roles.cache.find(x => x.id === autorole.role_id);
    if (autorole.toggle_group) {
        // buscar si existen más toggles
        const sameGroup = autoroles.filter(x => x.toggle_group === autorole.toggle_group);

        if (sameGroup.length > 1) {
            // hay varios toggles.
            // revisar si ha reaccionado con algún otro autorole con ese toggle.

            oldReaction:
            for (let i = 0; i < sameGroup.length; i++) {
                const toggledAutorole = sameGroup[i];

                const oldRole = guild.roles.cache.find(x => x.id === toggledAutorole.role_id);
                const oldEmote = toggledAutorole.emote;

                if (reactor.roles.cache.find(x => x === oldRole) && oldRole != role) {
                    // * el role se elimina en workerRemoveAutoRole
                    let oldC = guild.channels.cache.find(x => x.id === toggledAutorole.channel_id);
                    let oldM = oldC.messages.cache.get(toggledAutorole.message_id);

                    const f = !isNaN(oldEmote) ? x => x.emoji.id === oldEmote : x => x.emoji.name === oldEmote;
                    if (oldM) {
                        let reactions = oldM.reactions.cache.find(f);
                        reactions.users.remove(user.id);
                    }

                    continue oldReaction;
                }
            }
        }
    }

    reactor.roles.add(role)
        .then(() => console.log(`💬 Se agregó por AUTOROLES ${role.name} a ${reactor.user.tag}`))
        .catch(err => {
            return new Log()
                .setGuild(guild)
                .setTarget(ChannelModules.StaffLogs)
                .setReason(LogReasons.Error)
                .send({
                    embeds: [
                        new ErrorEmbed()
                            .defDesc(`Hubo un error agregando un ${hyperlink("AutoRole", message.url)} a ${user.tag}:${codeBlock("json", err)}`)
                    ]
                });
        })

});

GuildSchema.method("workerRemoveAutoRole", function (message, reaction, user) {
    const Log = require('../../src/utils/Log');

    const reactions = message.reactions.cache;
    const guild = message.guild;
    const reactor = guild.members.cache.get(user.id);
    const autoroles = this.data.autoroles;
    let emoji = reaction.emoji.id ?? reaction.emoji.name

    const autorole = autoroles.find(x =>
        x.emote === emoji &&
        x.message_id === message.id
    )

    if (!autorole) return;

    const role = guild.roles.cache.find(x => x.id === autorole.role_id);
    if (reactions.find(x => x.emoji === reaction.emoji)) {
        reactor.roles.remove(role)
            .then(() => console.log(`💬 Se eliminó por AUTOROLES ${role.name} a ${reactor.user.tag}`))
            .catch(err => {
                return new Log()
                    .setGuild(guild)
                    .setTarget(ChannelModules.StaffLogs)
                    .setReason(LogReasons.Error)
                    .send({
                        embeds: [
                            new ErrorEmbed()
                                .defDesc(`Hubo un error eliminando un ${hyperlink("AutoRole", message.url)} a ${user.tag}:${codeBlock("json", err)}`)
                        ]
                    });
            })
    }
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

GuildSchema.method("getDarkShopChannel", function (module) {
    return this.getChannel("darkshop." + module)
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

GuildSchema.method("getRoleByModule", function (module) {
    if (this.roles[module] instanceof Array) return console.log("🔴 SÓLO ROLES QUE SEAN STRINGS")

    return this.roles[module];
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

module.exports = mongoose.model('Guilds', GuildSchema);