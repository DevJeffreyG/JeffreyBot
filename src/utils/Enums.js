/**
 * Crea Enumeradores porque no sé como hacerlos en JavaScript.
 */
class Enum {
    #translations;

    /**
     * @param {Object} values Los valores del enumerador, pueden usarse los default para usar los métodos
     * @param {Boolean} customize Si se deberían cambiar los valores estandarizados por los personalizados
     */
    constructor(values, customize = true) {
        this.values = values
        this.customize = customize
    }

    /**
     * Busca el nombre del enumerador por su valor
     * @param {String | Number} input El valor a consultar
     * @param {Boolean} human Si debería traducirse friendly si existe
     * @returns {String}
     */
    translate(input, human = true) {
        const custom = this.#loadTranslations();
        let name = Object.keys(this.values).find(key => this.values[key] === input);

        if (custom && human) return custom[name] ?? name
        return name;
    }

    #loadTranslations() {
        const client = require("../");

        const CurrencyName = client.getCustomEmojis(client.lastInteraction?.guild.id)?.Currency?.name;
        const DarkCurrencyName = client.getCustomEmojis(client.lastInteraction?.guild.id)?.DarkCurrency?.name;

        this.#translations = {
            Multiplier: "Multiplicador",
            Probability: "Probabilístico",
            All: "Todo",
            Currency: this.customize && CurrencyName ? CurrencyName : "Dinero",
            DarkCurrency: this.customize && DarkCurrencyName ? DarkCurrencyName : "Dinero de DarkShop",
            ChatRewards: "Recompensas de Chat",
            CurrencyToExp: "Dinero a EXP",
            InflationPrediction: "Predicción Inflación",
            Level: "Nivel",
            Shop: "Tienda",
            PetShop: "Tienda de Mascotas",
            EXShop: "Tienda Externa",
            Positive: "Positivo",
            Negative: "Negativo",
            Add: "Agrega",
            Remove: "Elimina",
            Basic: "Básico",
            Critical: "Crítico",
            Advanced: "Avanzado",
            Ultimate: "Definitivo",
            Roulette: "Ruleta",
            ClaimRep: "Reclamar Rep",
            Yes: "Sí",
            Moderation: "Moderación",
            Pets: "Mascotas",
            Welcome: "Bienvenida",
            Subscriptions: "Suscripciones",
            Trophies: "Trofeos",
            Staff: "STAFF",
            Birthdays: "Cumpleaños",
            Incomes: "Ingresos",
            SubscriptionsCurrency: `${this.customize && CurrencyName ? CurrencyName : "Dinero"} en Suscripciones`,
            Developer: "Desarrollador",
            Administration: "Administración",
            Economy: "Economía",
            Fun: "Diversión",
            Music: "Música",
            DM: "Mensajes Directos",
            Suggestions: "Sugerencias",
            EXShopTTS: "EXShop: TTS"
        }

        for (const prop of Object.keys(this.values)) {
            if (!this.#translations[prop]) continue;

            return this.#translations;
        }

        return null
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
        return a.find(x => x === this.translate(query, false)) ? true : false;
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
            obj[first] = this.translate(this.values[name]);
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
 * - DM
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
    Music: "MUSIC",
    DM: "DM"
}).values

/**
 * - StackOverflow
 * - ResetInterest
 * - Firewall
 * - Subscription
 * - Temporal
 * - SkipFirewall
 * - Pet
 * - PetStatsModifier
 * - EXKeyboard
 * - EXMedia
 * - EXTTS
 */
const ItemTypes = new Enum({
    StackOverflow: 1,
    ResetInterest: 2,
    Firewall: 3,
    Subscription: 4,
    Temporal: 5,
    SkipFirewall: 6,
    Pet: 7,
    PetStatsModifier: 8,
    EXKeyboard: 9,
    EXMedia: 10,
    EXTTS: 11
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
 * - Probability
 */
const BoostTypes = new Enum({
    Multiplier: 1,
    Probability: 2
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
 * - Done
 */
const EndReasons = new Enum({
    OldCollector: 1,
    Over21: 2,
    GaveUp: 3,
    Blackjack: 4,
    Deleted: 5,
    TimeOut: 6,
    StoppedByUser: 7,
    Done: 8
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
 * - DarkShopLogs - Donde se envian los eventos de la DarkShop de un servidor
 */
const ChannelModules = new Enum({
    GuildLogs: "guild_logs",
    ModerationLogs: "moderation_logs",
    StaffLogs: "staff_logs",
    ClientLogs: "client_logs",
    SuggestionLogs: "suggestions",
    DarkShopLogs: "darkshop_logs"
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
 * - DSSunday
 * - AutomatedChange
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
    Error: 12,
    DSSunday: 13,
    AutomatedChange: 14
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
 * - PetShop
 * - EXShop
 */
const ShopTypes = new Enum({
    Shop: 1,
    DarkShop: 2,
    PetShop: 3,
    EXShop: 4
}).values;

/**
 * - Basic
 * - Critical
 * - Advanced
 * - Ultimate
 */
const PetAttacksType = new Enum({
    Basic: 1,
    Critical: 2,
    Advanced: 3,
    Ultimate: 4
}).values;

/**
 * - HalfHp
 * - Dead
 * - LowHp
 * - Hungry
 */
const PetNotices = new Enum({
    HalfHp: 1,
    Dead: 2,
    LowHp: 3,
    Hungry: 4
}).values;

/**
 * - Yes
 * - No
 */
const YesNo = new Enum({
    Yes: 1,
    No: 2
}).values;

/**
 * - Moderation
 * - Pets
 * - Welcome
 * - Payments
 * - Trophies
 * - Staff
 * - Birthdays
 * - Incomes
 */
const DirectMessageType = new Enum({
    Moderation: 1,
    Pets: 2,
    Welcome: 3,
    Payments: 4,
    Trophies: 5,
    Staff: 6,
    Birthdays: 7,
    Incomes: 8
}).values;

/**
 * - Warns
 * - Currency
 * - DarkCurrency
 * - Blackjack
 * - Roulette
 * - SubscriptionsCurrency
 */
const TrophyRequirements = new Enum({
    Warns: "warns",
    Currency: "currency",
    DarkCurrency: "darkcurrency",
    Blackjack: "blackjack",
    Roulette: "roulette",
    SubscriptionsCurrency: "subscriptions_currency"
}).values;

/**
 * - Suggestions
 * - Tickets
 * - EXShopTTS
 */
const ModuleBans = new Enum({
    Suggestions: "suggestions",
    Tickets: "tickets",
    EXShopTTS: "exshop.tts"
}).values;

/**
 * - SendDirect
 * - GlobalDatasWork
 * - HandleNotification
 * - ManageDarkShops
 * - PetWork
 */
const ToggleableFunctions = new Enum({
    SendDirect: 1,
    GlobalDatasWork: 2,
    HandleNotification: 3,
    ManageDarkShops: 4,
    PetWork: 5
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
    Tendencies,
    ChannelModules,
    LogReasons,
    ApiUpdate,
    Cooldowns,
    RequirementType,
    ModifierType,
    Multipliers,
    ChangelogTypes,
    ShopTypes,
    PetAttacksType,
    PetNotices,
    YesNo,
    DirectMessageType,
    TrophyRequirements,
    ModuleBans,
    ToggleableFunctions
}