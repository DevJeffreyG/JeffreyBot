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
                toggle_group: { type: String, default: null },
                id: { type: Number, sparse: true }
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

GuildSchema.static("getById", function (id) {
    return this.findOne({ guild_id: id })
});

GuildSchema.method("addAutorole", async function(emote, role_id, id){
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

        if(!creatable) return false;
    })

    console.log(creatable);

    if(!creatable) return null;

    this.data.autoroles.push({
        channel_id,
        message_id,
        emote,
        role_id,
        id
    });
    return await this.save();
})

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