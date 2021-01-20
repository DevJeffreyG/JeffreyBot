const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Stats = require("../modelos/darkstats.js");
const { stat } = require("fs");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}addjeffros`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}addjeffros <@usuario> <N° ${Emojis.Jeffros}/${Emojis.Dark}> (darkjeffros)\n▸ Añades Jeffros o DarkJeffros a un usuario.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}add-jeffros`);
  
  if(author.id === jeffreygID){}else {return;}
  
  let member = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
  let nJeffros = Math.floor(args[1]);
  
  if(!args[0]) return message.channel.send(embed);
  if(!args[1]) return message.channel.send(embed);
  if(!args[2] || args[2] != "1") {
  
  
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
  } else {
    Stats.findOne({
      userID: member.id
    }, (err, stats) => {
      if(err) throw err;

      if(!stats){
        const newStats = new Stats({
            userID: author.id,
            djeffros: nJeffros,
            accuracy: Number(Number(Math.random() * 15).toFixed(1)),
            items: {}
        });
        newStats.save();

        let cEmbed = new Discord.MessageEmbed()
        .setAuthor(`| DarkJeffros para tí!`, 'https://cdn.discordapp.com/emojis/496015995077525571.png')
        .setDescription(`
    **—** ${member.user.tag}
    **—** ${Emojis.Dark}${nJeffros}`)
        .setColor(Colores.verde);
        message.channel.send(cEmbed)
    } else {
        stats.djeffros += nJeffros;
        stats.save();
        let cEmbed = new Discord.MessageEmbed()
        .setAuthor(`| DarkJeffros para tí!`, 'https://cdn.discordapp.com/emojis/496015995077525571.png')
        .setDescription(`
    **—** ${member.user.tag}
    **—** ${Emojis.Dark}${stats.djeffros}`)
        .setColor(Colores.verde);
        message.channel.send(cEmbed)
    }
    })
  }

}

module.exports.help = {
    name: "addjeffros",
    alias: "add-jeffros"
}
