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
                name: {type: String, required: true},
                desc: {type: String},
                expl: {type: String, required: true},
                position: {type: Number},
                id: {type: Number, sparse: true}
            }
        ]
    },
    settings: {
        active_modules: {

        },
        autoroles: {
            channel_id: { type: String },
            message_id: { type: String }
        }
    },
    roles: { // id de roles
        admins: { type: Array },
        staffs: { type: Array },
        users: { type: Array },
        bots: { type: Array }
    },
    channels: {
        general_logs: { type: String },
        moderation_logs: { type: String },
        opinion_logs: { type: String },
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

GuildSchema.method("getVaultCode", function(code){
    return this.data.vault_codes.find(x => x.code === code);
})

GuildSchema.method("getVaultCodeById", function(id){
    return this.data.vault_codes.find(x => x.id === id);
})

GuildSchema.method("getAutoRole", function(id){
    return this.data.autoroles.find(x => x.id === id);
})

GuildSchema.method("getOrCreateToggleGroup", function(id){
    let q = this.data.togglegroups.find(x => x.id === id) ?? this.data.togglegroups.push({group_name: `Grupo ${id}`, id});
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

    if(!autorole) return;

    const role = guild.roles.cache.find(x => x.id === autorole.role_id);
    if(reactions.find(x => x.emoji === reaction.emoji)) {
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

module.exports = mongoose.model('Guilds', GuildSchema);