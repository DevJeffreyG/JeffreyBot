const mongoose = require('mongoose')

const Schema = mongoose.Schema


const ShopsSchema = new Schema({
    guild_id: { type: String, required: true },
    items: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String, required: true },
            reply: { type: String, default: "Item usado con éxito", required: true },
            req_role: { type: String },
            interest: { type: Number, default: 0, required: true },
            use_info: {
                effect: { type: String, default: null }, // en caso de ser de la darkshop
                action: { type: String, required: true }, // add | remove
                objetive: { type: String, required: true }, // warns, role, boost
                given: { type: String, required: true }, // puede ser un INT, o un ROLE, lo que se da
                isSub: { type: Boolean, required: true, default: false }, // es una sub?
                isTemp: { type: Boolean, required: true, default: false }, // es un temprole?
                duration: { type: Number, default: null }, // la duracion si es un sub, temprole o boost
                boost_type: { type: String, default: null },
                boost_value: { type: Number, default: null },
                boost_objetive: { type: String, default: null }
            },
            id: { type: Number, required: true, sparse: true }
        }
    ]
});

module.exports = mongoose.model('Shop', ShopsSchema);