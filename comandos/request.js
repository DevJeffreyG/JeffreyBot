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
  let modChat = guild.channels.cache.find(x => x.id === '503647603687424014')
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}raterequest`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}raterequest <Level ID> \n▸ ¿Has subido un nivel con decoración decente y medium-long? Probablemente, quieras tener rate. Con este comando puedes lograrlo.\n▸ Usa este comando apropiadamente, o no lo podrás usar más.\n▸ Para usar el comando tu nivel tiene que ser \`Medium-Long\`, tener decoración decente, y un gameplay aceptable, no secret ways.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}request`);
  
  if(!args[0]) return message.channel.send(embed);
  if(isNaN(args[0])) return message.channel.send(embed);
  
  let reqEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Rate request`, guild.iconURL())
  .setDescription(`**—**ID: \`${args[0]}\`
**—** Enviado por: \`${author.tag}\``)
  .setColor(Colores.verde)
  .setTimestamp();
  
  return modChat.send(reqEmbed);

}

module.exports.help = {
    name: "raterequest",
    alias: "request"
}
