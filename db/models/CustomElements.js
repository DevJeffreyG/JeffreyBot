const mongoose = require("mongoose");

const Schema = mongoose.Schema({
    guild_id: { type: String, required: true },
    embeds: [
        {
            title: { type: String },
            icon: { type: String },
            desc: { type: String },
            color: { type: Number },
            footer: { type: String },
            footer_icon: { type: String },
            time: { type: Boolean },
            img: { type: String },
            id: { type: Number, required: true, sparse: true }
        }
    ]
});

Schema.static("getOrCreate", async function (guild_id) {
    return await this.findOne({ guild_id }) ?? await new this({ guild_id }).save();
})

Schema.method("addEmbed", function (embed, id) {
    let embedToPush = {};

    embedToPush.id = id;

    if (embed.author || embed.title) {
        embedToPush.title = embed.author?.name ?? embed.title;
        embedToPush.icon = embed.author?.icon_url;
    }

    if (embed.description) embedToPush.desc = embed.description;
    if (embed.timestamp) embedToPush.time = true;
    if (embed.footer) {
        embedToPush.footer = embed.footer.text;
        embedToPush.footer_icon = embed.footer.icon_url;
    }

    if (embed.color) embedToPush.color = embed.color;

    this.embeds.push(embedToPush);
    return this;
})

Schema.method("getEmbed", function(id) {
    return this.embeds.find(x => x.id === id);
})

module.exports = mongoose.model("CustomElements", Schema)