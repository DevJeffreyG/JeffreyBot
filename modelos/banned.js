const mongoose = require("mongoose");

const bannedSchema = mongoose.Schema({

  userID: String,
  razon: String

})

module.exports = mongoose.model("Baneados", bannedSchema);
