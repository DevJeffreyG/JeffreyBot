const mongoose = require("mongoose");

const pesosSchema = mongoose.Schema({

  userID: String,
  serverID: String,
  jeffros: Number

})

module.exports = mongoose.model("Jeffros", pesosSchema);
