const mongoose = require("mongoose");

const darkSchema = mongoose.Schema({
    inflation: Decimal128, // Base 200, máximo (4)%
    since: Date, // fecha desde cuando está esa inflación
    duration: Number // duracion en dias
});

module.exports = mongoose.model("globalDark", darkSchema);
