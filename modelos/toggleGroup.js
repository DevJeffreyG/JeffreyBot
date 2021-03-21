const mongoose = require('mongoose')

const Schema = mongoose.Schema
const ObjectId = mongoose.Types.ObjectId

mongoose.set('useCreateIndex', true)

const ToggleSchema = new Schema({
    guild_id: { type: String, required: true },
    info: {
        group_name: { type: String, required: true },
        group_id: { type: String, required: true }
    }
})

module.exports = mongoose.model('ToggleGroup', ToggleSchema)