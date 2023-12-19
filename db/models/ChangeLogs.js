const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
    version: { type: String, required: true, unique: true },
    slogan: { type: String, require: false },
    changes: [
        {
            type: { type: Number, required: true },
            title: { type: String, required: true },
            description: { type: String }
        }
    ],
    timestamp: { type: Date, default: () => { return new Date() } },
})

Schema.static("create", async function (info, changes) {
    try {
        await new this({
            version: info.version,
            slogan: info.slogan ?? null,
            changes
        }).save()
        return true;
    } catch (err) {
        console.error("🔴 %s", err);
        return false;
    }
})

module.exports = mongoose.model('ChangeLogs', Schema)