const mongoose = require('mongoose');
const { ShopSchema } = require('../schemas');
const { ShopClass } = require('../classes');

const Schema = new mongoose.Schema(ShopSchema);
Schema.loadClass(ShopClass);

module.exports = mongoose.model('Shops', Schema);