const mongoose = require("mongoose");

const dUseSchema = mongoose.Schema({
  // Para cuando al comprar un item no se agrega o quita un rol al usuario.
  itemID: String, // id en DARKITEMS.JS
  info: Object

})

module.exports = mongoose.model("darkuses", dUseSchema);
