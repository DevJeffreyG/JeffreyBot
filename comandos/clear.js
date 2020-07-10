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
  message.delete();

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}clear`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}clear <N° de mensajes>`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}limpiar`);
  
  let delMgs = Number(args[0]);

  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  if(!delMgs) return message.channel.send(embed);

  message.channel.bulkDelete(delMgs).then(deleMsg => {
  message.channel.send(`Limpiados ${deleMsg.size} mensajes.`).then(msg => msg.delete(7000));
}).catch(err => {
    console.log(err);
  message.reply(`Sólo puedo eliminar mensajes que sean menores de 14 días. <:jgSad:492115297533165569>`).then(msg => msg.delete(7000));
});

}

module.exports.help = {
    name: "clear",
    alias: "limpiar"
}
