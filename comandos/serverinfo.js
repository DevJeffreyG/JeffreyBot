const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  
  let serverembed = new Discord.MessageEmbed()
  .setTitle("Información del server")
  .setColor(Colores.verde)
  .setThumbnail(message.guild.displayAvatarURL())
  .addField("▸ Nombre del server", message.guild.name)
  .addField("▸ Creado en...", message.guild.createdAt)
  .addField("▸ Tú te uniste...", message.guild.joinedAt)
  .addField("▸ Miembros en el server...", message.guild.memberCount)
  return message.channel.send(serverembed);

}

module.exports.help = {
    name: "serverinfo",
    alias: "server"
}
