const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const VaultsSchema = new Schema({
    guild_id: { type: String, required: true },
    codes: [
        {
            code: { type: String, required: true },
            reward: { type: Number, required: true, default: 100 },
            hints: [
                { type: String, required: true }
            ],
            id: { type: Number, required: true, sparse: true }
        }
    ]
});

module.exports = mongoose.model('Vault', VaultsSchema);