const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;

const ytdl = require("ytdl-core");

module.exports.run = async (bot, message, args, active) => {
  if (!message.content.startsWith(prefix)) return;

  let sadface = new Discord.MessageEmbed()
  .setAuthor(`| Error`, Config.errorPng)
  .setColor(Colores.rojo)
  .setDescription(`Los comandos de música de Jeffrey Bot están desactivados debido a problemas con el host.\n[▸ Anuncio](https://discordapp.com/channels/447797737216278528/485191462422577182/733704080714629160)`)
  return message.channel.send(sadface)
  
  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  let fetched = active.get(guild.id);
  
  // embeds  
  let errorE1 = new Discord.MessageEmbed()
    .setAuthor(`| Error`, Config.errorPng)
    .setDescription(`¡No hay ninguna canción en cola!`)
    .setColor(Colores.rojo);
  
  if(!fetched) return message.channel.send(errorE1);
  
  // variables comand
  let queue = fetched.queue;
  let nowPlaying = queue[0];
  
  let resp = `🎶 **| **__**Ahora en reproducción:**__\n\`${nowPlaying.songTitle}\`\n— **Pedida por: ${nowPlaying.requester}**\n\n__**En cola**__\n`;
  
  for (var i = 1; i < queue.length; i++){
    resp += `**${i}.** \`${queue[i].songTitle}\`\n— **Pedida por: ${queue[i].requester}**\n\n`;
  }
  
  let embed = new Discord.MessageEmbed()
  .setAuthor(`Música en cola`)
  .setDescription(resp)
  .setColor(Colores.verde);
  
  message.channel.send(embed);

};

module.exports.help = {
  name: "queue",
  alias: "cola"
};
