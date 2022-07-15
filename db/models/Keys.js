const mongoose = require('mongoose')

const Schema = mongoose.Schema


const KeysSchema = new Schema({
    config: {
        maxuses: { type: Number, required: true, default: 1 },
        used: { type: Number, required: true, default: 0 },
        usedBy: { type: Array }
    },
    reward: {
        type: { type: String, required: true },
        boost_type: {type: String, default: null },
        boost_value: {type: Number, default: null },
        boost_objetive: {type: String, default: null },
        value: { type: String, required: true },
        duration: { type: Number }
    },
    code: { type: String, required: true, unique: true },
    id: { type: Number, required: true, unique: true }
})

module.exports = mongoose.model('Keys', KeysSchema)