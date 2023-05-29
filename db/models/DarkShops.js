const mongoose = require('mongoose')

const Schema = mongoose.Schema

const DarkShopsSchema = new Schema({
    guild_id: { type: String, required: true },
    items: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String, required: true },
            reply: { type: String, default: "Item usado con éxito", required: true },
            req_role: { type: String, default: null },
            interest: { type: Number, default: 0, required: true },
            use_info: {
                effect: { type: Number, default: null },
                action: { type: Number, default: null }, // add | remove
                given: { type: String, default: null }, // puede ser un INT, o un ROLE, lo que se da
                objetive: { type: Number, default: null }, // warns, role, boost, item
                item_info: {
                    type: { type: Number, default: null },
                    duration: {type: Number, default: null }
                },
                boost_info: {
                    type: { type: Number, default: null },
                    value: { type: Number, default: null },
                    objetive: { type: Number, default: null }
                },
            },
            disabled: { type: Boolean, default: false },
            disabled_until: { type: Date, default: null },
            id: { type: Number, required: true, sparse: true }
        }
    ],
    inflation: {
        values: { type: Object, required: true },
        tendency_type: { type: Number, required: true },
        initial_value: { type: Number, required: true },
        last_value: { type: Number, default: null },
        since: { type: Date, required: true, default: () => {
            return new Date();
        } },
    },
    event: {
        newinflation: { type: Number },
        since: { type: Date },
        count: { type: Number }
    }
});

DarkShopsSchema.static("getWork", async function (id) {
    return await this.findOne({
        guild_id: id
    }) ?? null
})

DarkShopsSchema.method("findItem", function (itemId, strict = true) {
    return strict ?
        this.items.find(x => x.id === itemId && !x.disabled && x.use_info.action) :
        this.items.find(x => x.id === itemId);
})

DarkShopsSchema.method("findItemIndex", function (itemId) {
    let x = this.items.findIndex(x => x.id === itemId);
    return x < 0 ? null : x;
})

DarkShopsSchema.method("isUsable", function (item) {
    return item.after_use.action !== null && !item.disabled;
})

DarkShopsSchema.method("getItemType", function (item) {
    return item.use_info.item_info.type;
})

DarkShopsSchema.pre("save", function() {
    let inflation = this.inflation.toObject();

    delete inflation.value
    delete inflation.old
    delete inflation.duration

    this.inflation = inflation
})

module.exports = mongoose.model('DarkShops', DarkShopsSchema)