const mongoose = require("mongoose");

const commandSchema = mongoose.Schema({

  title: String,
  message: String,
  userLevel: String,
  cooldown: String,
  alias: String,
  id: Number

})

module.exports = mongoose.model("tvcommands", commandSchema);
