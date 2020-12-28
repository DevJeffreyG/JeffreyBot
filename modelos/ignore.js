const mongoose = require("mongoose");

const ignoreSchema = mongoose.Schema({
    itemID: Number,
    isDarkShop: Boolean
});

module.exports = mongoose.model("ignoreditems", ignoreSchema);
