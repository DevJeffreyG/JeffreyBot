const mongoose = require("mongoose");

const dUseSchema = mongoose.Schema({
  // Para cuando al comprar un item no se agrega o quita un rol al usuario.
  itemID: String, // id en DARKITEMS.JS
  action: String, // "delete" para quitar X cosa || "add" para agregar X cosa
  thing: String, // "jeffros" || "warns" || "role" || "item"
  thingID: String, // id de "thing", id de role, por ejemplo
  extra: Array, // puede ser por ejemplo; la duración del efecto
  id: Number // id del darkuso

})

module.exports = mongoose.model("darkuses", dUseSchema);
