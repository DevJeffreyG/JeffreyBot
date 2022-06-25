const fs = require('fs')
const mongoose = require('mongoose')

var models = {}

fs.readdirSync('./db/models/').forEach(f => {
    var model = require(`./models/${f}`)
    var modelName = f.replace('.js', '')
    models[modelName] = model
})

module.exports.connection = mongoose.connect(process.env.MONGOCONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})