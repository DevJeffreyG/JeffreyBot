const mongoose = require("mongoose");

const True = { type: Boolean, default: true };
const False = { type: Boolean, default: false };

const Schema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    direct_messages: {
        firstDmSent: False,
        options: {
            supressed: False,
            allowed: True
        },
        allowed: {
            moderation: True,
            pets: True,
            welcome: True,
            payments: True,
            trophies: True,
            staff: True,
            birthdays: True,
            incomes: True
        }
    }
})

Schema.static("getWork", async function (id) {
    return await this.findOne({
        user_id: id
    }) ?? await new this({
        user_id: id
    }).save();
})

module.exports = mongoose.model("Preferences", Schema);
