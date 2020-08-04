const mongoose = require("mongoose");

const dStatsSchema = mongoose.Schema({

  userID: String,
  djeffros: Number,
  accuracy: Number, // porcentaje de posibilidad de que funcione
  items: Object

})

module.exports = mongoose.model("darkstats", dStatsSchema);
