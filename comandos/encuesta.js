const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;
const logChannel = Config.logChannel;
const version = Config.version;

module.exports.run = async (bot, message, args) => {

      if(!message.content.startsWith(prefix))return;

  if(!args[0]) return message.channel.send("Ejem, ejem...\n¿Cuál es la encuesta...?");
  message.react("✅")
  .then(message.react("🤷"))
  .then(message.react("❌"));
}

module.exports.help = {
    name: "encuesta",
    alias: "poll"
}