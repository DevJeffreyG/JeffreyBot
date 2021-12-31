const mongoose = require('mongoose');
const { prefix } = require("../base.json");

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
        prefix: { type: String, required: true, default: prefix }
    },
    roles: { // id de roles
        admin: { type: String },
        staff: { type: String },
        users: { type: String },
        bots: { type: String }
    },
    channels: {
        general_logs: { type: String },
        moderation_logs: { type: String },
        staff_logs: { type: String },
    }
});

module.exports = mongoose.model('Guild', GuildSchema);