const Config = require("./../base.json");
const Colores = require("./../colores.json");
const reglas = require("./../reglas.json");
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

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  
  // Get the size of an object
  var size = Object.keys(reglas).length;
    
  //errores
  let rulesEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Reglas`, Config.jeffreyguildIcon)
  .setColor(Colores.verde)
  .setDescription(`▸ Las reglas enumeradas que son usadas en comandos como \`${prefix}softwarn\`, \`${prefix}warn\`, o \`${prefix}pardon\`.`)
  //agregar cada regla de la variable de reglas
  for(let i = 1; i <= size; i++){
      rulesEmbed.addField(reglas[i], `N° **${i}**`);
  }

  return message.channel.send(rulesEmbed);

}

module.exports.help = {
    name: "reglas",
    alias: "rules"
}
