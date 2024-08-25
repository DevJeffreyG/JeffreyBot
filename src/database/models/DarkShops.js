const mongoose = require('mongoose');
const { ShopSchema } = require('../schemas');
const { DarkShopClass } = require('../classes');

const Schema = new mongoose.Schema({
    ...ShopSchema,
    inflation: {
        values: { type: Object, required: true },
        tendency_type: { type: Number, required: true },
        initial_value: { type: Number, required: true },
        last_value: { type: Number, default: null },
        since: {
            type: Date, required: true, default: () => {
                return new Date();
            }
        },
    },
    event: {
        newinflation: { type: Number },
        since: { type: Date },
        count: { type: Number }
    }
});

Schema.loadClass(DarkShopClass);

Schema.pre("save", function () {
    let inflation = this.inflation.toObject();

    delete inflation.value
    delete inflation.old
    delete inflation.duration

    this.inflation = inflation
})

module.exports = mongoose.model('DarkShops', Schema)