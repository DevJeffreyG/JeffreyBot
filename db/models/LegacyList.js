const mongoose = require("mongoose");

const Schema = mongoose.Schema

const legacy = new Schema({

  guild_id: {type: String, required: true},
  user_list: [
    {
        user_id: {type: String, required: true },
        roles: [String],
        member_since: { type: Date }
    }
  ],
  lastupdate: { type: Date, default: () => { return new Date(); }}
})

module.exports = mongoose.model("LegacyList", legacy);
