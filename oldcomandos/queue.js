const Config = require("./../src/resources/base.json");
const Colores = require("./../src/resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

const ytdl = require("ytdl-core");

module.exports.run = async (client, message, args, active) => {
  if (!message.content.startsWith(prefix)) return;

  let sadface = new Discord.MessageEmbed()
  .setAuthor(`| Error`, Config.errorPng)
  .setColor(Colores.rojo)
  .setDescription(`Los comandos de música de Jeffrey Bot están desactivados debido a problemas con el host.\n[▸ Anuncio](https://discordapp.com/channels/447797737216278528/485191462422577182/733704080714629160)`)
  //return message.channel.send({embeds: [sadface]})
  
  // Variables
  const guild = message.guild;

  let fetched = active.get(guild.id);
  
  // embeds  
  let errorE1 = new Discord.MessageEmbed()
    .setAuthor(`| Error`, Config.errorPng)
    .setDescription(`¡No hay ninguna canción en cola!`)
    .setColor(Colores.rojo);
  
  if(!fetched) return message.channel.send({embeds: [errorE1]});
  
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
  
  message.channel.send({embeds: [embed]});

};

module.exports.help = {
  name: "queue",
  alias: "cola"
};
