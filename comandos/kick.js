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
  .setTitle(`Ayuda: ${prefix}kick`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}kick <@usuario> <razón> \n▸ Kickeas a alguien.`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
  let kUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
  if(!kUser) return message.channel.send(embed);
  let kRazon = args.join(" ").slice(args[0].length + 1);
  if(!kRazon) return message.channel.send(embed);
  
  // Si el usuario a banear tiene el permiso de banear también
  if(kUser.roles.cache.has(staffRole)) return console.log("NO.");
  if(kUser.id === author.id) return message.reply("Tú eres tonto.");
  
  let kEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Kick`, "https://cdn.discordapp.com/emojis/537792425129672704.png")
  .setDescription(`**—** Canal: **${message.channel}**.
**—** Kickeado por: **${author.username}**.
**—** A las: **${message.createdAt}**.
**—** Razón: **${kRazon}**`)
  .setColor(Colores.rojo);
  
  kUser.kick(kRazon).then(x => message.react("✅"));
  logC.send(kEmbed);

}

module.exports.help = {
    name: "kick",
}
