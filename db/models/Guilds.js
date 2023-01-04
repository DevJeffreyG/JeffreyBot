const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const GuildSchema = new Schema({
    guild_id: { type: String, required: true, unique: true },
    data: {
        tickets: [
            {
                type: { type: String, required: true },
                created_by: { type: String, required: true },
                channel_id: { type: String, required: true },
                message_id: { type: String, required: true },
                start_date: { type: Date, default: () => new Date() },
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
                suggestion: { type: String, required: true },
                accepted: { type: Boolean, default: null },
                reason: { type: String, default: null},
                id: { type: Number, sparse: true }
            }
        ],
        autoroles: [
            {
                channel_id: { type: String, required: true },
                message_id: { type: String, required: true },
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
                    // etc
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
            message_id: { type: String }
        },
        quantities: {
            blackjack_bet: { type: Number, default: 1000 },
            darkshop_level: { type: Number, default: 5 },
            percentage_skipfirewall: { type: Number, default: 100 }
        },
        functions: {
            adjust_shop: { type: Boolean, default: true },
            adjust_darkshop: { type: Boolean, default: true },
            baseprice_darkshop: { type: Number, default: 200, integer: true },
            currency_per_rep: { type: Number, default: 500, integer: true },
            levels_deleteOldRole: { type: Boolean, default: false },
            save_roles_onleft: { type: Boolean, default: true },
            min_exp: { type: Number, default: 5, integer: true },
            max_exp: { type: Number, default: 35, integer: true },
            min_curr: { type: Number, default: 5, integer: true },
            max_curr: { type: Number, default: 15, integer: true },
            sug_remind: { type: Number, default: 7, integer: true },
            ticket_remind: { type: Number, default: 7, integer: true },
        }
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
        suggester_role: { type: String }
    },
    channels: {
        logs: {
            guild_logs: { type: String },
            moderation_logs: { type: String },
            staff_logs: { type: String },
            suggestions: { type: String }
        },
        chat_rewards: [
            {
                channel: { type: String, required: true },
                multiplier: { type: Number, default: 1 }
            }
        ],
        notifier: {
            twitter_notif: { type: String },
            youtube_notif: { type: String },
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

GuildSchema.method("addAutoRole", async function (emote, role_id, id) {
    let channel_id = this.settings.autoroles.channel_id;
    let message_id = this.settings.autoroles.message_id;

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
        emote,
        role_id,
        id
    });
    return await this.save();
});

GuildSchema.method("workerAddAutoRole", async function (message, reaction, user) {
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
                    let oldM = await oldC.messages.fetch(toggledAutorole.message_id);

                    const f = !isNaN(oldEmote) ? x => x.emoji.id === oldEmote : x => x.emoji.name === oldEmote;
                    let reactions = oldM.reactions.cache.find(f);
                    await reactions.users.remove(user.id);

                    break oldReaction;
                }
            }
        }
    }

    await reactor.roles.add(role)
    console.log(`💬 Se agregó por AUTOROLES ${role.name} a ${reactor.user.tag}`)
});

GuildSchema.method("workerRemoveAutoRole", async function (message, reaction, user) {
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
        await reactor.roles.remove(role)
        console.log(`💬 Se eliminó por AUTOROLES ${role.name} a ${reactor.user.tag}`)
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

GuildSchema.method("getChannel", function(query) {
    let general = this.channels;
    const q = query.split(".");

    if(q.length >= 1){
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];
            
            general = general[queryQ]
        }
    }


    return general ?? null;
})

GuildSchema.method("getLogChannel", function(module) {
    return this.getChannel("logs." + module);
})

GuildSchema.method("getDarkShopChannel", function(module) {
    return this.getChannel("darkshop." + module)
})

GuildSchema.method("moduleIsActive", function(query) {
    let general = this.settings.active_modules;
    const q = query.split(".");

    if(q.length >= 1){
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];
            
            general = general[queryQ]
        }
    }

    return general;
})

GuildSchema.method("getRoleByModule", function(module) {
    if(this.roles[module] instanceof Array) return console.log("🔴 SÓLO ROLES QUE SEAN STRINGS")

    return this.roles[module];
})

GuildSchema.method("getEmoji", function(query) {
    let general = this.emojis;
    const q = query.split(".");

    if(q.length >= 1){
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];
            
            general = general[queryQ]
        }
    }

    return general;
})

module.exports = mongoose.model('Guilds', GuildSchema);