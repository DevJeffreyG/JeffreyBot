const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  
  if(bot.user.id === Config.testingJBID){
    adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
    modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
  }

  let admins;
  let mods;

  for(let i = 0; i < adminRole.members.map(user => user).length; i++){
    console.log(adminRole.members.map(user => user).length);
    if(i === 0){
      let map = adminRole.members.map(user => user);
      admins = `${map[0].tag}`;
    } else {
      let map = adminRole.members.map(user => user);
      admins = `${admins}, ${map[i].tag}`;
    }
  }

  for(let i = 0; i < modRole.members.map(user => user).length; i++){
    if(i === 0){
      let map = modRole.members.map(user => user);
      mods = `${map[0].tag}`;
    } else {
      let map = modRole.members.map(user => user);
      mods = `${mods}, ${map[i].tag}`;
    }
  }

  let serverembed = new Discord.MessageEmbed()
  .setTitle(`Información del server — ${message.guild.name}`)
  .setColor(Colores.verde)
  .setThumbnail(message.guild.iconURL())
  .setDescription(`**— Creado el:** ${message.guild.createdAt}
  **— Tú te uniste el:** ${message.member.joinedAt}
  **— Miembros totales:** ${message.guild.memberCount}`)
  .addField(`— ${adminRole.name}`, `${admins}`)
  .addField(`— ${modRole.name}`, `${mods}`)
  return message.channel.send(serverembed);

}

module.exports.help = {
    name: "serverinfo",
    alias: "server"
}
