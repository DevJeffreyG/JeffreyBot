const mongoose = require("mongoose");

const toggleSchema = mongoose.Schema({
    command: String
});

module.exports = mongoose.model("togglecommands", toggleSchema);
