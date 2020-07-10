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
  .setTitle(`Ayuda: ${prefix}kick`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}kick <@usuario> <razón> \n▸ Kickeas a alguien.`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  let kUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
  if(!kUser) return message.channel.send(embed);
  let kRazon = args.join(" ").slice(args[0].length + 1);
  if(!kRazon) return message.channel.send(embed);
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  // Si el usuario a banear tiene el permiso de banear también
  if(kUser.roles.cache.has(staffRole)) return console.log("NO.");
  if(kUser.id === author.id) return message.reply("Tú eres tonto.");
  
  let kEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Kick`, "https://cdn.discordapp.com/emojis/537792425129672704.png")
  .setDescription(`**—** Canal: **${message.channel}**.
**—** Kickeado por: **${author.username}**.
**—** A las: **${message.createdAt}**.
**—** Razón: **${kRazon}**`)
  .setColor(Colores.rojo);
  
  kUser.kick(kRazon).then(x => message.react("✅"));
  logC.send(kEmbed);

}

module.exports.help = {
    name: "kick",
}
