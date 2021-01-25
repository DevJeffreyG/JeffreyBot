const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  
  if(client.user.id === Config.testingJBID){
    adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
    modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
  }

  let admins = adminRole.members.map(user => user);
  let mods = modRole.members.map(user => user);

  let serverembed = new Discord.MessageEmbed()
  .setTitle(`Información del server — ${message.guild.name}`)
  .setColor(Colores.verde)
  .setThumbnail(message.guild.iconURL())
  .setDescription(`**— Creado el:** ${message.guild.createdAt}
  **— Tú te uniste el:** ${message.member.joinedAt}
  **— Miembros totales:** ${message.guild.memberCount}`)
  .addField(`— @${adminRole.name}`, `${admins}`)
  .addField(`— @${modRole.name}`, `${mods}`)
  return message.channel.send(serverembed);

}

module.exports.help = {
    name: "serverinfo",
    alias: "server"
}
