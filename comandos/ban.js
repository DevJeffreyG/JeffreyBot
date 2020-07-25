const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;
const logChannel = Config.logChannel;
const version = Config.version;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Reporte = require("../modelos/reporte.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Banned = require("../modelos/banned.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let logC = message.guild.channels.cache.find(x => x.id === logChannel);

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}ban`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}ban <@usuario> (razón) \n▸ Baneas a alguien.`)
  .setFooter(`<> Obligatorio () Opcional`);

  // Si el usuario no tiene permiso de banear
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  
    if(!args[0]) return message.channel.send(embed);
    
    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
    let bRazon = args.join(" ").slice(args[0].length + 1);
  
    if(!args[1]) {bRazon = "Sin especificar."}

    // Si el usuario a banear tiene el permiso de banear también
    if(bUser.roles.cache.has(staffRole)) return console.log("NO.");
    if(bUser.id === author.id) return message.reply("Tú eres tonto.");

    let bEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Ban`, author.displayAvatarURL())
    .setDescription(`
**—** Usuario baneado: **${bUser}**.\n\n
**—** Ban en: **${message.channel}**.\n\n
**—** Moderador: **${message.author.username}**.\n\n
**—** Tiempo: **${message.createdAt}**.\n\n
**—** Razón de ban: **${bRazon}**.
      `)
    .setColor(Colores.rojo);

    message.guild.members.ban(bUser, {reason: bRazon}).then(x => message.react("✅")); // Baneado
    logC.send(bEmbed);

}


module.exports.help = {
    name: "ban"
}
