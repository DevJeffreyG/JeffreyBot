const mongoose = require('mongoose');
const { ShopSchema } = require('../schemas');
const { ShopClass } = require('../classes');
const { integerValidator, positiveWithZeroValidator } = require('../Validators');

let PetSchema = Object.assign({}, ShopSchema)
PetSchema.items[0].stats = {
    hp: { type: Number, validate: [integerValidator, positiveWithZeroValidator], required: true, default: 20 },
    hunger: { type: Number, validate: [integerValidator, positiveWithZeroValidator], required: true, default: 0 },
    attack: { type: Number, required: true, validate: positiveWithZeroValidator, default: 5 },
    defense: { type: Number, required: true, validate: positiveWithZeroValidator, default: 5 }
}

const Schema = new mongoose.Schema(PetSchema);
Schema.loadClass(ShopClass);

module.exports = mongoose.model('PetShops', Schema);