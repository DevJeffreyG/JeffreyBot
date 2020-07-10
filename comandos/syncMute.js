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

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Reporte = require("../modelos/reporte.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Banned = require("../modelos/banned.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;
  if(message.author.id != jeffreygID) return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let muteRole = guild.roles.cache.find(x => x.id === Config.muteRole);
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}comando`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}comando <> \n▸ Explicación.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}alias`);

  message.guild.channels.forEach(async (channel, id) => {
    await channel.overwritePermissions(muteRole, {
      VIEW_CHANNEL: false,
      SEND_MESSAGES: false,
      ADD_REACTIONS: false
    });
  });
  
  message.react("✅");

}

module.exports.help = {
    name: "syncMute",
    alias: "sMute"
}
