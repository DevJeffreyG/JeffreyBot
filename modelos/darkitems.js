const mongoose = require("mongoose");

const ditemsSchema = mongoose.Schema({

  serverID: String,
  itemName: String,
  itemPrice: String,
  itemDescription: String,
  replyMessage: String,
  id: Number

})

module.exports = mongoose.model("darkitems", ditemsSchema);
