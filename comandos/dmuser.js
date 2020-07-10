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
  let member = message.member;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}dmuser`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}dmuser <@usuario> <mensaje a enviar por MD> \n▸ Le envio un mensaje directo a X usuario.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}mduser`);
  
  if(member.roles.find(x => x.id === staffRole.id)){} else return;
  
  let mdMember = guild.member(message.guild.members.cache.get(args[0]) || message.mentions.users.first());
  if(!mdMember) return message.channel.send(embed).then(a => a.delete(ms('30s')));
  
  if(mdMember.user.bot) return;
  
  let mensaje = args.join(" ").slice(args[0].length + 1);
  if(!args[1]) return message.channel.send(embed).then(a => a.delete(ms('30s')));
  
  if(!message.content.includes("{nombre}")){
    mdMember.send(`${mensaje}`)
    .then(a => message.react("✅"))
    .catch(e => {
      return message.reply(`Usuario con los MDs desactivados.`).then(a => a.delete(ms('20s')));
    })
    
    
  } else {
    let str = args.join(" ").slice(args[0].length + 1);
    let finalStr = str.replace(new RegExp('{nombre}', "g"), `**${author.tag}**`);

    mdMember.send(`${finalStr}`)
    .then(a => message.react("✅"))
    .catch(e => {
      return message.reply(`Usuario con los MDs desactivados.`).then(a => a.delete(ms('20s')));
    })
  }
}

module.exports.help = {
    name: "dmuser",
    alias: "mduser"
}
