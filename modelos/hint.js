const mongoose = require("mongoose");

const hintSchema = mongoose.Schema({

  codeID: String, // id de MODELOS/VAULT.JS
  hint: String, // la pista (texto)
  num: Number, // el numero de orden en las pistas, 1ero, 2ndo, etc.
  id: Number // hintID en MODELOS/VAULT.JS

})

module.exports = mongoose.model("hints", hintSchema);
