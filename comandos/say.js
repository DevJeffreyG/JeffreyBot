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
const botsVip = Config.botsVip;
const logChannel = Config.logChannel;
const version = Config.version;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Reporte = require("../modelos/reporte.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Banned = require("../modelos/banned.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
    
  if(!message.content.startsWith(prefix))return;

  if(message.channel.id != botsChannel && message.channel.id != botsVip && author.id === jeffreygID){
    if(!args[0]){
      return message.reply(`Faltó el canal al donde enviar el mensaje.`);
    }

    let mChannel = message.mentions.channels.first() || guild.channel.get(args[0]);

    let botMessage = args.join(" ").slice(args[0].length + 1);

    message.delete();
    message.channel.send(`Enviando mensaje...`)
    .then(() => {
      mChannel.startTyping();

      setTimeout(() => {
        mChannel.send(botMessage);
        mChannel.stopTyping();
      }, ms("3s"));
    })
  } else {
    if(!args[0] && !args[1]) return message.channel.send("No tengo nada que decir. ;_;");
    let botMessage = args.join(" ");
    message.delete().catch();
    message.channel.send(botMessage);
  }
}

module.exports.help = {
    name: "say",
    alias: "di"
}