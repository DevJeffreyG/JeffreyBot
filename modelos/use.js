const mongoose = require("mongoose");

const useSchema = mongoose.Schema({
  // Para cuando al comprar un item no se agrega o quita un rol al usuario.
  serverID: String,
  itemID: String, // id en ITEMS.JS
  action: String, // "delete" para quitar X cosa || "add" para agregar X cosa
  thing: String, // "jeffros" || "warns" || "role"
  thingID: String,
  id: Number

})

module.exports = mongoose.model("uses", useSchema);
