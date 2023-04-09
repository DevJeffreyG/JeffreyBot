const mongoose = require("mongoose");
const Schema = new mongoose.Schema({
    target: { type: Number, required: true },
    value: { type: String, required: true },
    prob: { type: Number, required: true },
    extra: {
        special: { type: Number, default: null },
        duration: { type: String, default: null },
        boosttype: { type: Number, default: null },
        boostobj: { type: Number, default: null },
        boostvalue: { type: Number, default: null }
    },
    id: { type: Number, required: true, sparse: true },
})

Schema.static("new", async function (data, id) {
    const { target, value, prob, extra } = data;

    let newExtra = {};

    console.log(extra)


    for(prop in extra) {
        let isNaN = extra[prop].toString() === "NaN";
        console.log(prop, isNaN);
        newExtra[prop] = isNaN ? null : extra[prop];
    }

    return await new this({
        target,
        value,
        prob,
        extra: newExtra,
        id
    }).save();
})

Schema.static("getAll", async function () {
    return await this.find();
})

module.exports = mongoose.model('RouletteItems', Schema)