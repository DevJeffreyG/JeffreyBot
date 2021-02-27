const mongoose = require("mongoose");

const purchasedSchema = mongoose.Schema({
    userID: String,
    itemID: String, // id en ITEMS.JS
    quantity: Number,
    isDarkShop: Boolean
});

module.exports = mongoose.model("totalPurchases", purchasedSchema);
