const mongoose = require("mongoose");

const darkSchema = mongoose.Schema({
    oldinflation: Number, // Inflación vieja
    inflation: Number, // Base 200, máximo (4)%
    since: Date, // fecha desde cuando está esa inflación
    duration: Number // duracion en dias
});

module.exports = mongoose.model("globalDark", darkSchema);
