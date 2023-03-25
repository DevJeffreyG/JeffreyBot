const mongoose = require("mongoose");

const rolesSchema = mongoose.Schema({
    serverID: String,
    roleID: String,
    emoji: String,
    channelID: String,
    messageID: String,
    custom: Number, // Si es un emoji personalizado,
    toggleGroup: { type: String, default: "0" },
    id: Number
})

module.exports = mongoose.model("AutoRoles", rolesSchema);
