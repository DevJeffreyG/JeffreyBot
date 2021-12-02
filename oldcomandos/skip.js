const Config = require("../base.json");
const Colores = require("../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (client, message, args, active) => {
  if (!message.content.startsWith(prefix)) return;

  let sadface = new Discord.MessageEmbed()
  .setAuthor(`| Error`, Config.errorPng)
  .setColor(Colores.rojo)
  .setDescription(`Los comandos de música de Jeffrey Bot están desactivados debido a problemas con el host.\n[▸ Anuncio](https://discordapp.com/channels/447797737216278528/485191462422577182/733704080714629160)`)
  //return message.channel.send({embeds: [sadface]})
  
  // Variables
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  let fetched = active.get(guild.id);
  
  // embeds  
  let errorE1 = new Discord.MessageEmbed()
    .setAuthor(`| Error: 1`, Config.errorPng)
    .setDescription(`¡No hay ninguna canción sonando ahora!`)
    .setColor(Colores.rojo);
  
  let errorE2 = new Discord.MessageEmbed()
  .setAuthor(`| Error: 2`, Config.errorPng)
  .setDescription(`Lo siento, no estás en el mismo chat de voz con el bot.`)
  .setColor(Colores.rojo);
  
  if(!fetched) return message.channel.send({embeds: [errorE1]});
  
  if(message.member.voice.channelID !== guild.me.voice.channelID) return message.channel.send({embeds: [errorE2]});

  //cuantos usuarios estan en el canal?
  let userCount = message.member.voice.channel.members.size;
  
  //cuantos votos se necesitan para saltar la cancion
  let required = Math.ceil(userCount / 2);
  
  //update fetched
  if(!fetched.queue[0].voteSkips) fetched.queue[0].voteSkips = [];
  
  // revisar si alguien ya ha votado
  
  let errorE3 = new Discord.MessageEmbed()
  .setAuthor(`| Error: 3`, Config.errorPng)
  .setDescription(`Lo siento, tú ya votaste para saltar.
\`${fetched.queue[0].voteSkips.length}\`/\`${required}\` requeridos.`)
  .setColor(Colores.rojo);
  
  if(fetched.queue[0].voteSkips.includes(message.member.id)) return message.channel.send({embeds: [errorE3]});
  
  //añadir el usuario a voteskips
  fetched.queue[0].voteSkips.push(message.member.id);
  
  //update map
  active.set(message.guild.id, fetched);
  
  // revisar si hay votos suficientes
  if(fetched.queue[0].voteSkips.length >= required || message.member.roles.cache.find(x => x.id === staffRole.id)){
    //output
    let embed = new Discord.MessageEmbed()
    .setDescription(`¡Se ha saltado la canción!`)
    .setColor(Colores.verde);
    message.channel.send({embeds: [embed]});
    
    //emitir finish event
    return fetched.dispatcher.emit('finish');
  }
  
  // y sino, decir que se registró el voto
  let addedVoteE = new Discord.MessageEmbed()
  .setDescription(`Se ha registrado tu voto para saltar.
\`${fetched.queue[0].voteSkips.length}\`/\`${required}\` requeridos.`)
  message.channel.send({embeds: [addedVoteE]});
};

module.exports.help = {
  name: "skip"
};
