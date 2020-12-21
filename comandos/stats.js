const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Exp = require("../modelos/exp.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let mainChannel = guild.channels.cache.find(x => x.id === Config.mainChannel);
  let member;

  if(bot.user.id === Config.testingJBID){
    mainChannel = guild.channels.cache.find(x => x.id === "535500338015502357");
  }
  
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
      
      if(!jeffros || !exp){
        message.reply(`No tienen Jeffros, EXP, habla en ${mainChannel} para ganarlos.`)
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
