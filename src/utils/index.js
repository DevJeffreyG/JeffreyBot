const HumanMs = require("./HumanMs");
const Command = require("./Command");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");
const InteractivePages = require("./InteractivePages");

const Functions = require("./functions");

module.exports = {
    HumanMs,
    Command,
    Embed,
    ErrorEmbed,
    InteractivePages,

    ...Functions
}