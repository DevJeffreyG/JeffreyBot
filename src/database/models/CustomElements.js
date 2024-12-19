const mongoose = require("mongoose");
const { positiveValidator, integerValidator, canBeNumber } = require("../Validators");

const Schema = mongoose.Schema({
    guild_id: { type: String, required: true },
    embeds: [
        {
            name: { type: String, default: null },
            title: { type: String },
            desc: { type: String },
            urls: {
                icon: { type: String },
                image: { type: String },
                footer: { type: String }
            },
            color: { type: Number },
            footer: { type: String },
            linkedids: [
                {
                    id: { type: Number },
                    isAutoRole: { type: Boolean, default: false }
                }
            ],
            id: { type: Number, required: true, sparse: true },
        }
    ],
    groups: {
        embeds: [{
            identifier: { type: String, required: true, default: "Sin identificador" },
            ids: [{ type: Number, validate: [integerValidator, positiveValidator] }],
            id: { type: Number, required: true, sparse: true }
        }]
    },
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
                role: { type: String, validate: canBeNumber },
                currency: { type: Number, validate: integerValidator },
                darkcurrency: { type: Number, validate: integerValidator },
                boost: {
                    type: { type: Number },
                    objetive: { type: Number },
                    value: { type: Number, validate: positiveValidator },
                    duration: { type: String, required: true, default: "1d" }
                },
                item: {
                    id: { type: Number, validate: [positiveValidator, integerValidator] },
                    shopType: { type: Number, default: false }
                }
            },
            req: {
                role: { type: String, validate: canBeNumber },
                totals: {
                    warns: { type: Number, validate: [positiveValidator, integerValidator] },
                    currency: { type: Number, validate: [positiveValidator, integerValidator] },
                    darkcurrency: { type: Number, validate: [positiveValidator, integerValidator] },
                    blackjack: { type: Number, validate: [positiveValidator, integerValidator] },
                    roulette: { type: Number, validate: [positiveValidator, integerValidator] },
                    subscriptions_currency: { type: Number, validate: [positiveValidator, integerValidator] },
                    secured_currency: { type: Number, validate: [positiveValidator, integerValidator] },
                },
                moment: {
                    currency: { type: Number, validate: integerValidator },
                    darkcurrency: { type: Number, validate: positiveValidator },
                    secured_currency: { type: Number, validate: [positiveValidator, integerValidator] },
                    level: { type: Number, validate: [positiveValidator, integerValidator] }
                }
            },
            enabled: { type: Boolean, default: false },
            id: { type: Number, required: true, sparse: true }
        }
    ]
});

Schema.static("getWork", async function (guild_id) {
    return await this.findOne({ guild_id }) ?? await new this({ guild_id }).save();
})

Schema.method("addEmbed", function (embed, id, identifier) {
    let embedToPush = {
        urls: {
            icon: null,
            image: null,
            footer: null
        }
    };

    embedToPush.id = id;
    embedToPush.name = identifier;

    if (embed.author || embed.title) {
        embedToPush.title = embed.author?.name ?? embed.title;
        embedToPush.urls.icon = embed.author?.icon_url;
    }

    if (embed.description) embedToPush.desc = embed.description;
    if (embed.timestamp) embedToPush.time = true;
    if (embed.footer) {
        embedToPush.footer = embed.footer.text;
        embedToPush.urls.footer = embed.footer.icon_url;
    }

    if (embed.color) embedToPush.color = embed.color;
    if (embed.image)
        embedToPush.urls.image = embed.image.url;

    this.embeds.push(embedToPush);
    return this;
})

Schema.method("getEmbedGroup", function (id) {
    return this.groups.embeds.find(x => x.id === id);
})

Schema.method("getEmbed", function (id) {
    return this.embeds.find(x => x.id === id);
})

Schema.method("deleteEmbed", function (id) {
    let index = this.embeds.findIndex(x => x.id === id);

    if (index != -1) {
        this.embeds.splice(index, 1)
        return this;
    } else {
        throw index;
    }
})

Schema.method("deleteEmbedGroup", function (id) {
    let index = this.groups.embeds.findIndex(x => x.id === id);

    if (index != -1) {
        this.groups.embeds.splice(index, 1)
        return this;
    } else {
        throw index;
    }
})

Schema.method("addButton", function (button, id) {
    let buttonToPush = { ...button };

    buttonToPush.id = id;

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