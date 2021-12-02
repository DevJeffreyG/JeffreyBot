const mongoose = require('mongoose')

const Schema = mongoose.Schema

const ToggleSchema = new Schema({
    command: { type: String, required: true },
    reason: { type: String, required: true, default: "Mantenimiento" },
    since: { type: Date, default: () => new Date() }
})

module.exports = mongoose.model('ToggledCommand', ToggleSchema)