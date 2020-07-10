const mongoose = require("mongoose");

const breporteSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    userID: String,
    bug: String,
    time: String
});

module.exports = mongoose.model("BugReport", breporteSchema);
