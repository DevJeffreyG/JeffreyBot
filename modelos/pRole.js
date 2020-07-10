const mongoose = require("mongoose");

const pRoleSchema = mongoose.Schema({
    userID: String,
    roleID: String
});

module.exports = mongoose.model("PersonalRoles", pRoleSchema);
