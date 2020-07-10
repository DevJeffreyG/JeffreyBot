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
  let member;
  
  
  if(!args[0]){
    member = message.guild.member(author)
  } else {
    member = message.mentions.members.first() || message.guild.members.cache.find(x => x.id === args[0]);
    if(!member) {
      return message.reply("no encontré a ese usuario...");
    }
  }
  
  Exp.findOne({
    serverID: guild.id,
    userID: member.user.id
  }, (err, exp) => {
    if(err) throw err;
    
    Jeffros.findOne({
      serverID: guild.id,
      userID: member.user.id
    }, (err2, jeffros) => {
      if(err2) throw err2;
      
      if(!jeffros){
        message.reply(`No tienen Jeffros, EXP, habla en <#${mainChannel}> para ganarlos.`)
      } else {
        
        
        let curLvl = exp.level;
        let nxtLvl = exp.level * 300 + (exp.level * 5);
        let curExp = exp.exp;
        let nxtLvlExp = curLvl * 300 + (exp.level * 5);
        let expDiff = nxtLvlExp - curExp;
        
        if(exp.level === 0){ // Si el nivel del usuario a penas es 0, para subir de nivel deberá tener 100 de exp.
          nxtLvlExp = 100;
        }
        
        if(exp.level === 1){
            nxtLvl = 200;
            nxtLvlExp = 200;
        }
        
        
        let meEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Estadísticas de ${member.user.tag}`, member.user.displayAvatarURL())
        .setDescription(`**— Nivel**: ${exp.level}
**— EXP**: ${exp.exp} / ${nxtLvlExp}.
**— Jeffros**: ${Emojis.Jeffros}${jeffros.jeffros}.  
**— Reputación**: ${exp.reputacion}.`)
        .setThumbnail(Config.jeffreyguildIcon)
        .setColor(Colores.verde);

        return message.channel.send(meEmbed);
      }
    })
  })

}

module.exports.help = {
    name: "stats",
    alias: "estadisticas"
}
