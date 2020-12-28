const mongoose = require("mongoose");

const itemsSchema = mongoose.Schema({

  serverID: String,
  itemName: String,
  itemPrice: String,
  itemDescription: String,
  replyMessage: String,
  roleRequired: String,
  ignoreInterest: Boolean,
  id: Number

})

module.exports = mongoose.model("items", itemsSchema);
