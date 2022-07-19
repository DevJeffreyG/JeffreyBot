const Config = require("./../src/resources/base.json");
const Colores = require("./../src/resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

const ytdl = require("ytdl-core");

module.exports.run = async (client, message, args, active) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
    
  // embeds
  let fetched = active.get(guild.id);
  
  let errorE1 = new Discord.EmbedBuilder()
  .setAuthor(`| Error: 1`, Config.errorPng)
  .setDescription(`Por favor, conéctate a un canal de voz.`)
  .setColor(Colores.rojo);
  
  let errorE2 = new Discord.EmbedBuilder()
  .setAuthor(`| Error: 2`, Config.errorPng)
  .setDescription(`Lo siento, no estoy en ningún canal de voz.`)
  .setColor(Colores.rojo);
  
  let errorE3 = new Discord.EmbedBuilder()
  .setAuthor(`| Error: 3`, Config.errorPng)
  .setDescription(`Lo siento, no estás en el mismo chat de voz con el bot.`)
  .setColor(Colores.rojo);
  
  let errorE4 = new Discord.EmbedBuilder()
  .setAuthor(`| Error: 4`, Config.errorPng)
  .setDescription(`La música ya está pausada.`)
  .setColor(Colores.rojo);  
  
  // author está en el canal?
  if(!message.member.voice) return message.channel.send({embeds: [errorE1]});
  
  // client está en el canal?
  if(!guild.me.voice) return message.channel.send({embeds: [errorE2]});
  
  // están en el mismo canal?
  if(guild.me.voiceID !== message.member.voiceID) return message.channel.send({embeds: [errorE3]});
  
  if(fetched.dispatcher.paused) return message.channel.send({embeds: [errorE4]});
  
  fetched.dispatcher.pause();
  
  //output
  let embed = new Discord.EmbedBuilder()
  .setDescription(`**⏸️ | Pausado \`${fetched.queue[0].songTitle}\` con éxito.**`)
  .setColor(Colores.verde);
  
  message.channel.send({embeds: [embed]});

}

module.exports.help = {
    name: "pause",
    alias: "stop"
}
