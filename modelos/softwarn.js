const mongoose = require("mongoose");

const swarnSchema = mongoose.Schema({
    userID: String,
    warns: Array
});

module.exports = mongoose.model("SoftWarn", swarnSchema);
