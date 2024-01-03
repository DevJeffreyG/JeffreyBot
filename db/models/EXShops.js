const mongoose = require('mongoose');
const { ShopSchema } = require('../schemas');
const { ShopClass } = require('../classes');
const { positiveValidator, integerValidator, positiveWithZeroValidator } = require('../Validators');
const { ItemTypes } = require("../../src/utils/Enums");

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

module.exports = mongoose.model('EXShops', Schema);