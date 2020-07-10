const mongoose = require("mongoose");

const ignoreSchema = mongoose.Schema({
    itemID: Number
});

module.exports = mongoose.model("ignoreditems", ignoreSchema);
