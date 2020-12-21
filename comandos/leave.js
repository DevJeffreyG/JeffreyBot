const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

const ytdl = require("ytdl-core");

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(bot.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }
    
  // embeds
  
  let errorE1 = new Discord.MessageEmbed()
  .setAuthor(`| Error: 1`, Config.errorPng)
  .setDescription(`Por favor, conéctate a un canal de voz.`)
  .setColor(Colores.rojo);
  
  let errorE2 = new Discord.MessageEmbed()
  .setAuthor(`| Error: 2`, Config.errorPng)
  .setDescription(`Lo siento, no estoy en ningún canal de voz.`)
  .setColor(Colores.rojo);
  
  let errorE3 = new Discord.MessageEmbed()
  .setAuthor(`| Error: 3`, Config.errorPng)
  .setDescription(`Lo siento, no estás en el mismo chat de voz con el bot.`)
  .setColor(Colores.rojo);
  
  let errorE4 = new Discord.MessageEmbed()
  .setAuthor(`| Error: 4`, Config.errorPng)
  .setDescription(`No puedes usar este comando si hay más personas en el canal ni tampoco eres Staff del servidor.`)
  .setColor(Colores.rojo);  
  
  // author está en el canal?
  if(!message.member.voice) return message.channel.send(errorE1);
  
  // bot está en el canal?
  if(!guild.me.voice) return message.channel.send(errorE2);
  
  // están en el mismo canal?
  if(guild.me.voice.channelID !== message.member.voice.channelID) return message.channel.send(errorE3);
  
  let userCount = message.member.voice.channel.members.size;
  if(userCount === 2 || message.member.roles.cache.find(x => x.id === staffRole.id)){
    let embed = new Discord.MessageEmbed()
    .setDescription(`🔌 | **Saliendo...**`)
    .setColor(Colores.verde);

    //salir
    guild.me.voice.channel.leave();

    // output
    message.channel.send(embed);
  } else {
    return message.channel.send(errorE4);
  }
  
  

}

module.exports.help = {
    name: "leave"
}
