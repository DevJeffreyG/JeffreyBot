const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;


module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let logC = guild.channels.cache.find(x => x.id === Config.logChannel);

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    logC = guild.channels.cache.find(x => x.id === "483108734604804107");
  }
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}unban`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}unban <User ID>`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
  if(!args[0]) return message.channel.send({embeds: [embed]});
  let unbUser = args[0];
  
  let bEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Unban`, author.displayAvatarURL())
  .setDescription(`
**—** Usuario desbaneado: **${unbUser}**.
**—** Moderador: **${message.author.username}**.
    `)
  .setColor(Colores.verde);
  
  guild.members.unban(unbUser)
  .then(s => {
    message.react("✅");
    logC.send({embeds: [bEmbed]});
  })
  

}

module.exports.help = {
    name: "unban"
}
