const HumanMs = require("./HumanMs");
const Command = require("./Command");
const ContextMenu = require("./ContextMenu");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");
const InteractivePages = require("./InteractivePages");
const FilePages = require("./FilePages");
const Shop = require("./Shop");
const DarkShop = require("./DarkShop");
const Top = require("./Top");
const Item = require("./Item");
const RouletteItem = require("./RouletteItem");
const Managers = require("./Managers");
const Blackjack = require("./Blackjack");
const Log = require("./Log");
const CustomEmojis = require("./CustomEmojis");
const Modal = require("./Modal");
const Collector = require("./Collector");
const CustomEmbed = require("./CustomEmbed");
const CustomButton = require("./CustomButton");
const CustomTrophy = require("./CustomTrophy");
const Pet = require("./Pet");

const Enums = require("./Enums");
const Functions = require("./functions");

module.exports = {
    HumanMs,
    Command,
    ContextMenu,
    Embed,
    ErrorEmbed,
    InteractivePages,
    FilePages,
    DarkShop,
    Shop,
    Top,
    Item,
    RouletteItem,
    Managers,
    Blackjack,
    Log,
    CustomEmojis,
    Modal,
    Collector,
    CustomEmbed,
    CustomButton,
    CustomTrophy,
    Pet,

    ...Enums,
    ...Functions
}