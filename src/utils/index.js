const HumanMs = require("./HumanMs");
const Command = require("./Command");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");

const Functions = require("./functions");

module.exports = {
    HumanMs,
    Command,
    Embed,
    ErrorEmbed,

    ...Functions
}