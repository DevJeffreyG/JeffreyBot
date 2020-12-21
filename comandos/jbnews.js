const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables  
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let jbNRole = guild.roles.cache.find(x => x.id === '573308631018110986');
  let jbChannel = guild.channels.cache.find(x => x.id === Config.announceChannel);

  if(bot.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    jbNRole = guild.roles.cache.find(x => x.id === '790393911519870986');
    jbChannel = guild.channels.cache.find(x => x.id === "483007967239602196");
  }
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}jbnews`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}jbnews <anuncio>`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}announcenews`);
  
  if(!args[0]) return message.channel.send(embed);
  let anuncio = args.join(" ");
  
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

    let nEmbed = new Discord.MessageEmbed()
    .setColor(Colores.verde)
    .setTitle(`¡Novedades de Jeffrey Bot!`)
    .setDescription(anuncio)
    .setFooter(`Noticia por ${author.tag}`, bot.user.displayAvatarURL())
	  .setTimestamp()
    .setThumbnail(bot.user.displayAvatarURL());
    
    jbChannel.send(`${jbNRole}~`).then(r => {
      jbChannel.send(nEmbed);
    }).catch(e => console.log(e));

}

module.exports.help = {
    name: "jbnews",
    alias: "announcenews"
}
