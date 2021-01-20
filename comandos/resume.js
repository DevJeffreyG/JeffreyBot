const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (bot, message, args, active) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
    
  // embeds
  let fetched = active.get(guild.id);
  
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
  .setDescription(`La música no está pausada.`)
  .setColor(Colores.rojo);  
  
  // author está en el canal?
  if(!message.member.voice) return message.channel.send(errorE1);
  
  // bot está en el canal?
  if(!guild.me.voice) return message.channel.send(errorE2);
  
  // están en el mismo canal?
  if(guild.me.voiceID !== message.member.voiceID) return message.channel.send(errorE3);
  
  if(!fetched.dispatcher.paused) return message.channel.send(errorE4);
  
  fetched.dispatcher.resume();
  
  //output
  let embed = new Discord.MessageEmbed()
  .setDescription(`**▶️ | Resumido \`${fetched.queue[0].songTitle}\` con éxito.**`)
  .setColor(Colores.verde);
  
  message.channel.send(embed);

}

module.exports.help = {
    name: "resume",
    alias: "continuar"
}
