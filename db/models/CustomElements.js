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
            buttonids: [
                {
                    id: { type: Number },
                    isAutoRole: { type: Boolean, default: false }
                }
            ],
            id: { type: Number, required: true, sparse: true },
        }
    ],
    buttons: [
        {
            texto: { type: String },
            emoji: { type: String },
            style: { type: Number },
            link: { type: String },
            embedids: [{ type: Number }],
            id: { type: Number, required: true, sparse: true }
        }
    ],
    trophies: [
        {
            name: { type: String, required: true },
            desc: { type: String },
            given: {
                role: { type: String }
            },
            req: {
                role: { type: String },
                totals: {
                    warns: { type: Number },
                    currency: { type: Number },
                    darkcurrency: { type: Number },
                    blackjack: { type: Number },
                    roulette: { type: Number }
                }
            },
            enabled: { type: Boolean, default: false },
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

Schema.method("getEmbed", function (id) {
    return this.embeds.find(x => x.id === id);
})

Schema.method("deleteEmbed", function (id) {
    let index = this.embeds.findIndex(x => x === this.getEmbed(id));

    if (index != -1) {
        this.embeds.splice(index, 1)
        return this;
    } else {
        throw index;
    }
})

Schema.method("addButton", function (button, id, embedIds = []) {
    let buttonToPush = {};

    buttonToPush.id = id;
    buttonToPush.embedids = embedIds;

    if (button.emoji) buttonToPush.emoji = button.emoji.id ?? button.emoji.name;
    if (button.label) buttonToPush.texto = button.label;
    if (button.style) buttonToPush.style = button.style;

    this.buttons.push(buttonToPush);
    return this;
})

Schema.method("getButton", function (id) {
    return this.buttons.find(x => x.id === id);
})

Schema.method("deleteButton", function (id) {
    let index = this.buttons.findIndex(x => x === this.getButton(id));

    if (index != -1) {
        this.buttons.splice(index, 1)
        return this;
    } else {
        throw index;
    }
})

Schema.method("addTrophy", function (trophy, id) {
    this.trophies.push({ ...trophy, id });
})

Schema.method("getTrophy", function (id) {
    return this.trophies.find(x => x.id === id);
})

Schema.method("deleteTrophy", function (id) {
    let index = this.trophies.findIndex(x => x === this.getTrophy(id));

    if (index != -1) {
        this.trophies.splice(index, 1)
        return this;
    } else {
        throw index;
    }
})

module.exports = mongoose.model("CustomElements", Schema)