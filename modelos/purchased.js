const mongoose = require("mongoose");

const purchasedSchema = mongoose.Schema({
    userID: String,
    itemID: String // id en ITEMS.JS
});

module.exports = mongoose.model("purchases", purchasedSchema);
