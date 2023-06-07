/**
 * Crea Enumeradores porque no sé como hacerlos en JavaScript.
 */
class Enum {
    /**
     * @param {Object} values Los valores del enumerador, pueden usarse los default para usar los métodos
     */
    constructor(values) {
        this.values = values
    }

    /**
     * Busca el nombre del enumerador por su valor
     * @param {String} input El valor a consultar
     * @returns String
     */
    translate(input) {
        return Object.keys(this.values).find(key => this.values[key] === input);
    }

    /**
     * Convierte el objeto en un Array con los nombres de los enumeradores
     * @returns Array
     */
    array() {
        return Object.keys(this.values);
    }

    /**
     * Revisa si el valor existe en el Enum actual, es como translate sólo que devuelve un boolean
     * @param {*} query El valor a consultar
     * @returns Boolean
     */
    exists(query) {
        let a = this.array();
        return a.find(x => x === this.translate(query)) ? true : false;
    }

    /**
     * Convierte los datos en un array de forma.
     * #### Predeterminado: [{name: nombre, value: valor}]
     * @returns Array
     */
    complexArray(options = { first: "name", second: "value", valueString: false }) {
        let arr = [];
        const first = options.first ?? "name";
        const second = options.second ?? "value";
        const valueString = options.valueString ?? false;

        let names = this.array();

        for (const name of names) {
            let obj = {};
            obj[first] = String(name);
            obj[second] = valueString ? String(this.values[name]) : this.values[name];

            arr.push(obj)
        }

        return arr;
    }
}

/**
 * - General
 * - Fun
 * - Economy
 * - DarkShop
 * - Staff
 * - Administration
 * - Moderation
 * - Developer
 * - Music
 */
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

/**
 * - StackOverflow
 * - ResetInterest
 * - Firewall
 * - Subscription
 * - Temporal
 * - SkipFirewall
 */
const ItemTypes = new Enum({
    StackOverflow: 1,
    ResetInterest: 2,
    Firewall: 3,
    Subscription: 4,
    Temporal: 5,
    SkipFirewall: 6
}).values

/**
 * - Positive
 * - Negative
 */
const ItemEffects = new Enum({
    Positive: 1,
    Negative: 2
}).values

/**
 * - Add
 * - Remove
 */
const ItemActions = new Enum({
    Add: 1,
    Remove: 2
}).values

/**
 * - Warns
 * - Role
 * - Item
 * - Boost
 * - Currency
 * - TempRole
 * - Exp
 */
const ItemObjetives = new Enum({
    Warns: 1,
    Role: 2,
    Item: 3,
    Boost: 4,
    Currency: 5,
    TempRole: 6,
    Exp: 7
}).values

/**
 * - Multiplier
 * - Probabilities
 */
const BoostTypes = new Enum({
    Multiplier: 1,
    Probabilities: 2
}).values

/**
 * - Currency
 * - Exp
 * - All
 */
const BoostObjetives = new Enum({
    Currency: 1,
    Exp: 2,
    All: 3
}).values

/**
 * - OldCollector
 * - Over21
 * - GaveUp
 * - Blackjack
 * - Deleted
 * - TimeOut
 * - StoppedByUser
 */
const EndReasons = new Enum({
    OldCollector: 1,
    Over21: 2,
    GaveUp: 3,
    Blackjack: 4,
    Deleted: 5,
    TimeOut: 6,
    StoppedByUser: 7
}).values

/**
 * - Spade
 * - Heart
 * - Diamond
 * - Clover
 */
const CardType = new Enum({
    Spade: 1,
    Heart: 2,
    Diamond: 3,
    Clover: 4
}).values

/**
 * - Random
 * - Decreasing
 * - LargeSpike
 * - SmallSpike
 * - LastMinute
 * - InitialSpike
 */
const Tendencies = new Enum({
    Random: 1,
    Decreasing: 2,
    LargeSpike: 3,
    SmallSpike: 4,
    LastMinute: 5,
    InitialSpike: 6
}).values

/**
 * - GuildLogs - Logs para los eventos del servidor
 * - ModerationLogs - Logs para los comandos de moderación
 * - StaffLogs - Interacciones de usuarios en el server (tickets, recordatorios, etc) o simplemente logs/info para Staffs
 * - ClientLogs - Logs para Developer
 * - SuggestionLogs - Donde se envían las sugerencias 
 */
const ChannelModules = new Enum({
    GuildLogs: "guild_logs",
    ModerationLogs: "moderation_logs",
    StaffLogs: "staff_logs",
    ClientLogs: "client_logs",
    SuggestionLogs: "suggestions"
}).values

/**
 * - Ticket
 * - Suggestion
 * - Warn
 * - SoftWarn
 * - Pardon
 * - Ban
 * - TimeOut
 * - MsgClear
 * - AutoMod
 * - Logger
 * - Settings
 * - Error
 */
const LogReasons = new Enum({
    Ticket: 1,
    Suggestion: 2,
    Warn: 3,
    SoftWarn: 4,
    Pardon: 5,
    Ban: 6,
    TimeOut: 7,
    MsgClear: 8,
    AutoMod: 9,
    Logger: 10,
    Settings: 11,
    Error: 12
}).values

/**
 * - ActiveModules
 * - Quantities
 * - Functions
 * - Roles
 * - LevelRoles
 * - Channels
 * - RewardChannels
 * - Categories
 */
const ApiUpdate = new Enum({
    ActiveModules: 1,
    Quantities: 2,
    Functions: 3,
    Roles: 4,
    LevelRoles: 5,
    Channels: 6,
    RewardChannels: 7,
    Categories: 8
}).values

/**
 * - Coins
 * - ChatRewards
 * - Rep
 * - ClaimRep
 * - Roulette
 * - Blackjack
 * - CurrencyToExp
 * - InflationPrediction
 * - Rob
 */
const Cooldowns = new Enum({
    Coins: "coins",
    ChatRewards: "chat_rewards",
    Rep: "rep",
    ClaimRep: "claim_rep",
    Roulette: "roulette",
    Blackjack: "blackjack",
    CurrencyToExp: "currency_to_exp",
    InflationPrediction: "inflation_prediction",
    Rob: "rob"
}).values;

/**
 * - Level
 * - Role
 */
const RequirementType = new Enum({
    Level: 1,
    Role: 2
}).values;

/**
 * - Cooldown
 * - Multiplier
 */
const ModifierType = new Enum({
    Cooldown: 1,
    Multiplier: 2
}).values;

/**
 * - ChatRewards
 */
const Multipliers = new Enum({
    ChatRewards: "chat_rewards"
}).values

/**
 * - Added
 * - Updated
 * - Removed
 */
const ChangelogTypes = new Enum({
    Added: 1,
    Updated: 2,
    Removed: 3
}).values;

/**
 * - Shop
 * - DarkShop
 */
const ShopTypes = new Enum({
    Shop: 1,
    DarkShop: 2
}).values;

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
    Tendencies,
    ChannelModules,
    LogReasons,
    ApiUpdate,
    Cooldowns,
    RequirementType,
    ModifierType,
    Multipliers,
    ChangelogTypes,
    ShopTypes
}