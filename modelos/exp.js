const mongoose = require("mongoose");

const expSchema = mongoose.Schema({

  userID: String,
  username: String,
  serverID: String,
  exp: Number,
  level: Number,
  reputacion: Number,
  top: Number

})

module.exports = mongoose.model("Exp", expSchema);
