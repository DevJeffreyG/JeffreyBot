const mongoose = require("mongoose");

const reporteSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    userID: String,
    razon: String,
    rUsername: String,
    rID: String,
    time: String
});

module.exports = mongoose.model("Reporte", reporteSchema);
