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
  let jbNRole = guild.roles.cache.find(x => x.id === '573308631018110986');
  let jbChannel = guild.channels.cache.find(x => x.id === Config.announceChannel);
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}jbnews`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}jbnews <anuncio>`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}announcenews`);
  
  if(!args[0]) return message.channel.send(embed);
  let anuncio = args.join(" ");
  
  if(!message.member.roles.cache.find(x => x.id === Config.staffRole)) return;
  
  jbNRole.edit({ mentionable: true }).then(role => {
    let nEmbed = new Discord.MessageEmbed()
    .setColor(Colores.verde)
    .setTitle(`¡Novedades de Jeffrey Bot!`)
    .setDescription(anuncio)
    .setFooter(`Noticia por ${author.tag}`, bot.user.displayAvatarURL())
	  .setTimestamp()
    .setThumbnail(bot.user.displayAvatarURL());
    
    jbChannel.send('<@&573308631018110986>~').then(r => {
      console.log("se supone que se envió el mensaje de la mención");
      jbChannel.send(nEmbed);
      return role.edit({mentionable: false});
    })
    .catch(e => console.log(e));
  }).catch(e => console.log(e));

}

module.exports.help = {
    name: "jbnews",
    alias: "announcenews"
}
