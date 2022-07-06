const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const GuildSchema = new Schema({
    guild_id: { type: String, required: true },
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
        ]
    },
    settings: {
        
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
        staff_logs: { type: String },
    }
});

GuildSchema.static("getById", function(id){
    return this.findOne({guild_id: id})
});

GuildSchema.method("getAdmins", function(){
    return this.roles.admins
});

GuildSchema.method("getStaffs", function(){
    return this.roles.staffs
});

GuildSchema.method("getUsers", function(){
    return this.roles.users
});

GuildSchema.method("getBots", function(){
    return this.roles.bots
});

module.exports = mongoose.model('Guilds', GuildSchema);