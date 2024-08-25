const fs = require('fs')
const mongoose = require('mongoose')

mongoose.set("strictQuery", true);

var models = {}

fs.readdirSync('./src/database/models/').forEach(f => {
    var model = require(`./models/${f}`)
    var modelName = f.replace('.js', '')
    models[modelName] = model
})

module.exports.connection = mongoose.connect(process.env.MONGOCONNECT)