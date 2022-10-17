const HumanMs = require("./HumanMs");
const Command = require("./Command");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");
const InteractivePages = require("./InteractivePages");
const Ticket = require("./Ticket");
const Shop = require("./Shop");
const Top = require("./Top");
const Item = require("./Item");
const Managers = require("./Managers");

const Enums = require("./Enums");
const Functions = require("./functions");

module.exports = {
    HumanMs,
    Command,
    Embed,
    ErrorEmbed,
    InteractivePages,
    Ticket,
    Shop,
    Top,
    Item,
    Managers,

    ...Enums,
    ...Functions
}