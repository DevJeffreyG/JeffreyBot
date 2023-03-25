const mongoose = require("mongoose");

const vaultSchema = mongoose.Schema({

  reward: Number,
  code: String, // CODIGO FINAL / GANADOR
  id: Number // id del codigo

})

module.exports = mongoose.model("VaultCodes", vaultSchema);
