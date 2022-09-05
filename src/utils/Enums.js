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
    ResetInterest: 2
})

module.exports = {
    Categories,
    ItemTypes
}