const Schema = {
    guild_id: { type: String, required: true, unique: true },
    items: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String, required: true },
            reply: { type: String, default: "Item usado con éxito", required: true },
            req_role: { type: String, default: null },
            interest: { type: Number, default: 0, required: true },
            use_info: {
                manualUse: { type: Boolean, default: true },
                effect: { type: Number, default: null },
                action: { type: Number, default: null }, // add | remove
                given: { type: String, default: null }, // puede ser un INT, o un ROLE, lo que se da
                objetive: { type: Number, default: null }, // warns, role, boost, item
                item_info: {
                    type: { type: Number, default: null },
                    duration: { type: Number, default: null }
                },
                boost_info: {
                    type: { type: Number, default: null },
                    value: { type: Number, default: null },
                    objetive: { type: Number, default: null }
                },
            },
            disabled: { type: Boolean, default: false },
            disabled_until: { type: Date, default: null },
            canHaveMany: { type: Boolean, default: false },
            id: { type: Number, required: true, sparse: true }
        }
    ],
    discounts: [
        {
            level: { type: Number, required: true },
            discount: { type: Number, required: true },
            id: { type: Number, sparse: true, required: true }
        }
    ]
}

module.exports = Schema;