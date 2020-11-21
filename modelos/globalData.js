const mongoose = require("mongoose");

const globalDSchema = mongoose.Schema({
    info: Object
});

module.exports = mongoose.model("globalDatas", globalDSchema);
