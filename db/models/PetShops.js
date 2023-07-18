const mongoose = require('mongoose');
const { ShopSchema } = require('../schemas');
const { ShopClass } = require('../classes');
const { integerValidator, positiveValidator } = require('../Validators');

let PetSchema = Object.assign({}, ShopSchema)
PetSchema.items[0].stats = {
    hp: { type: Number, validate: [integerValidator, positiveValidator], required: true, default: 20 },
    hunger: { type: Number, validate: [integerValidator, positiveValidator], required: true, default: 100 },
    attack: { type: Number, required: true, validate: positiveValidator, default: 5 },
    defense: { type: Number, required: true, validate: positiveValidator, default: 5 }
}

const Schema = new mongoose.Schema(PetSchema);
Schema.loadClass(ShopClass);

module.exports = mongoose.model('PetShops', Schema);