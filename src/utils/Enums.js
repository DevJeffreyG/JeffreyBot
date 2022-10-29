class Enum {
    constructor (values) {
        this.values = values
        
        return values
    }
}

const Categories = new Enum({
    General: "GENERAL",
    Fun: "FUN",
    Economy: "ECONOMY",
    DarkShop: "DARKSHOP",
    Staff: "STAFF",
    Administration: "ADMIN",
    Moderation: "MODERATION",
    Developer: "DEV",
    Music: "MUSIC"
})

const ItemTypes = new Enum({
    StackOverflow: 1,
    ResetInterest: 2,
    Firewall: 3,
    Subscription: 4,
    Temporal: 5
})

const ItemEffects = new Enum({
    Positive: 1,
    Negative: 2
})

const ItemActions = new Enum({
    Add: 1,
    Remove: 2
})

const ItemObjetives = new Enum({
    Warns: 1,
    Role: 2,
    Item: 3,
    Boost: 4,
    Jeffros: 5,
    TempRole: 6
})

const BoostTypes = new Enum({
    Multiplier: 1,
    Probabilities: 2
})

const BoostObjetives = new Enum({
    Jeffros: 1,
    Exp: 2,
    All: 3
})

const EndReasons = new Enum({
    OldCollector: 1
})

module.exports = {
    Categories,
    ItemTypes,
    ItemEffects,
    ItemActions,
    ItemObjetives,
    BoostTypes,
    BoostObjetives,
    EndReasons
}