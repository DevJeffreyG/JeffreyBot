class Enum {
    constructor (values) {
        this.values = values
    }

    translate(input){
        return Object.keys(this.values).find(key => this.values[key] === input);
    }

    array(){
        return Object.keys(this.values);
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
}).values

const ItemTypes = new Enum({
    StackOverflow: 1,
    ResetInterest: 2,
    Firewall: 3,
    Subscription: 4,
    Temporal: 5
}).values

const ItemEffects = new Enum({
    Positive: 1,
    Negative: 2
}).values

const ItemActions = new Enum({
    Add: 1,
    Remove: 2
}).values

const ItemObjetives = new Enum({
    Warns: 1,
    Role: 2,
    Item: 3,
    Boost: 4,
    Jeffros: 5,
    TempRole: 6
}).values

const BoostTypes = new Enum({
    Multiplier: 1,
    Probabilities: 2
}).values

const BoostObjetives = new Enum({
    Jeffros: 1,
    Exp: 2,
    All: 3
}).values

const EndReasons = new Enum({
    OldCollector: 1,
    Over21: 2,
    GaveUp: 3,
    Blackjack: 4
}).values

const CardType = new Enum({
    Spade: 1,
    Heart: 2,
    Diamond: 3,
    Clover: 4
}).values

const Tendencies = new Enum({
    Random: 1,
    Decreasing: 2,
    LargeSpike: 3,
    SmallSpike: 4
}).values

module.exports = {
    Enum,
    Categories,
    ItemTypes,
    ItemEffects,
    ItemActions,
    ItemObjetives,
    BoostTypes,
    BoostObjetives,
    EndReasons,
    CardType,
    Tendencies
}