const mongoose = require("mongoose");

const warnSchema = mongoose.Schema({
    userID: String,
    warns: Number
});

module.exports = mongoose.model("Warn", warnSchema);
