const mongoose = require("mongoose");

const ditemsSchema = mongoose.Schema({

  itemName: String,
  itemPrice: String,
  itemDescription: String,
  ignoreInterest: Boolean,
  id: Number

})

module.exports = mongoose.model("darkitems", ditemsSchema);
