const mongoose = require('mongoose');
const { ShopSchema } = require('../schemas');
const { ShopClass } = require('../classes');
const { positiveValidator, integerValidator, positiveWithZeroValidator } = require('../Validators');
const { ItemTypes } = require("../../src/utils/Enums");
const moment = require("moment-timezone");

let EXSchema = Object.assign({}, ShopSchema);

EXSchema.items[0].use_info.external_info = {
    type: { type: Number, required: true, default: ItemTypes.EXKeyboard },
    actions: [
        { type: String }
    ],
    delays: {
        keys: { type: Number, validate: [positiveValidator, integerValidator], default: 50, required: true },
        global: { type: Number, validate: [positiveWithZeroValidator] },
        individual: { type: Number, validate: [positiveWithZeroValidator] }
    }
}

EXSchema.cooldowns = [{
    user_id: { type: String, default: null },
    until: { type: Date, required: true },
    item_id: { type: Number, required: true }
}]

const Schema = new mongoose.Schema(EXSchema);
Schema.loadClass(ShopClass);

Schema.pre("save", function () {
    for (const cooldown of this.cooldowns) {
        if (moment().isAfter(cooldown.until)) {
            const i = this.cooldowns.indexOf(cooldown);
            this.cooldowns.splice(i, 1);
        }
    }

    return this;
})

module.exports = mongoose.model('EXShops', Schema);