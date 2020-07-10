const mongoose = require("mongoose");

const cuentaSchema = mongoose.Schema({
  userID: String,
  discordname: String,
  username: String, // JeffreyNet
  realname: String, // JeffreyNet
  bio: String,
  age: String,
  sex: String,
  hex: String,
  birthd: String,
  birthy: String,
  bdString: String,
  bdMonthString: String,
  bdDayString: String,
  seenBy: Number

})

module.exports = mongoose.model("Cuenta", cuentaSchema);
