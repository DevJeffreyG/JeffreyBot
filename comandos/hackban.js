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
  .setTitle(`Ayuda: ${prefix}hackban`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}hackban <ID> (razón) \n▸ Baneas a alguien que no está en el servidor.`)
  .setFooter(`<> Obligatorio () Opcional`);

    if(!args[0]) return message.channel.send(embed);
    
    let bUser = args[0];
    let bRazon = args.join(" ").slice(args[0].length + 1);
  
    if(!args[1]) {bRazon = "Hackban, sin especificar."}

    // Si el usuario no tiene permiso de banear
    if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}

    let bEmbed = new Discord.MessageEmbed()
  .setAuthor(`| HackBan`, author.displayAvatarURL())
    .setDescription(`
**—** Usuario baneado { ID }: **${bUser}**.
**—** Usuario baneado { @ }: <@${bUser}>
**—** Ban en: **${message.channel}**.
**—** Moderador: **${message.author.username}**.
**—** Tiempo: **${message.createdAt}**.
**—** Razón de ban: **${bRazon}**.
      `)
    .setColor(Colores.rojo);

    guild.ban(bUser, {reason: `${bRazon}`}).then(x => message.react("✅")); // Baneado
    logC.send(bEmbed);

}


module.exports.help = {
    name: "hackban",
    alias: "hban"
}
