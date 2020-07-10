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

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let logC = guild.channels.cache.find(x => x.id === logChannel);
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}unban`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}unban <User ID>`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  
  let unbUser = args[0];
  
  let bEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Unban`, author.displayAvatarURL())
  .setDescription(`
**—** Usuario desbaneado: **${unbUser}**.
**—** Moderador: **${message.author.username}**.
    `)
  .setColor(Colores.verde);
  
  guild.members.unban(unbUser)
  .then(s => {
    message.react("✅");
    logC.send(bEmbed);
  })
  

}

module.exports.help = {
    name: "unban"
}
