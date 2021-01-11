const Config = require("./base.json");
const Rainbow = require("./rainbow.json");
const Colores = require("./colores.json");
const Emojis = require("./emojis.json");
const Discord = require("discord.js");
const { Structures } = require('discord.js');
const anyBase = require("any-base");
const prettyms = require("pretty-ms");
const dec2hex = anyBase(anyBase.DEC, anyBase.HEX);
const bot = new Discord.Client({ disableMentions: "everyone" });
const fs = require("fs");
const ms = require("ms");
var Chance = require("chance");
var chance = new Chance();

const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const logChannel = Config.logChannel;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const mainVip = Config.mainVip;
const botsChannel = Config.botsChannel;
const botsVip = Config.botsVip;
const staffComandos = Config.staffComandos;
const staffChat = Config.staffChat;

// ############################

/* ##### MONGOOSE ######## */

const mongoose = require("mongoose");
mongoose.connect(`${process.env.MONGOCONNECT}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Jeffros = require("./modelos/jeffros.js");
const Exp = require("./modelos/exp.js");
const AutoRole = require("./modelos/autorole.js");
const Toggle = require("./modelos/toggle.js");

const GlobalData = require("./modelos/globalData.js");
const Stats = require("./modelos/darkstats.js");

/* ##### MONGOOSE ######## */

// Turn bot off (destroy), then turn it back on
const resetBot = function (channel) {
  // send channel a message that you're resetting bot [optional]
  channel
    .send("Reseteando...")
    .then(msg => bot.destroy())
    .then(() => bot.login(process.env.TOKEN))
    .then(() => channel.send("Reviví sin problemas."));
}

module.exports = {
    resetBot
}