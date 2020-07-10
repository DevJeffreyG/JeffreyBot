const mongoose = require("mongoose");

const wonSchema = mongoose.Schema({

  codeID: String, // id de MODELOS/VAULT.JS
  userID: String // id del codigo

})

module.exports = mongoose.model("wonCodes", wonSchema);
