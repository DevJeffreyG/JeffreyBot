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
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}addjeffros`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}addjeffros <@usuario> <N° ${Emojis.Jeffros}> \n▸ Explicación.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}add-jeffros`);
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){}else {return;}
  
  let member = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
  let nJeffros = Math.floor(args[1]);
  
  if(!args[0]) return message.channel.send(embed);
  if(!args[1]) return message.channel.send(embed);
  
  
  /* #### ADDING JEFFROS */
  Jeffros.findOne({
    userID: member.id
  }, (err, jeffros) => {
    if(err) throw err;
    
    if(!jeffros){
      const newJeffros = new Jeffros({
        userID: member.id,
        serverID: guild.id,
        jeffros: nJeffros
      })
      
      newJeffros.save()
      .catch(e => console.log(e));
      
      let cEmbed = new Discord.MessageEmbed()
      .setAuthor(`| Jeffros para tí!`, 'https://cdn.discordapp.com/emojis/496015995077525571.png')
      .setDescription(`
**—** ${member.user.tag}
**—** ${Emojis.Jeffros}${nJeffros}`)
      .setColor(Colores.verde);
      message.channel.send(cEmbed);
    } else {
      jeffros.jeffros = jeffros.jeffros + nJeffros;
      
      jeffros.save()
      .catch(e => console.log(e));
      
      let cEmbed = new Discord.MessageEmbed()
      .setAuthor(`| Jeffros para tí!`, 'https://cdn.discordapp.com/emojis/496015995077525571.png')
      .setDescription(`
**—** ${member.user.tag}
**—** ${Emojis.Jeffros}${jeffros.jeffros}`)
      .setColor(Colores.verde);
      message.channel.send(cEmbed);
    }
  })

}

module.exports.help = {
    name: "addjeffros",
    alias: "add-jeffros"
}
