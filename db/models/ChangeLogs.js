const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
    version: { type: String, required: true, unique: true },
    changes: [
        {
            type: { type: Number, required: true },
            title: { type: String, required: true },
            description: { type: String }
        }
    ],
    timestamp: { type: Date, default: () => { return new Date() } },
})

Schema.static("create", async function(version, changes) {
    try {
        await new this({
            version,
            changes,
            id
        }).save()
        return true;
    } catch(err) {
        console.log(err)
        return false;
    }
})

module.exports = mongoose.model('ChangeLogs', Schema)