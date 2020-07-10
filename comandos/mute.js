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
  let muteRole = guild.roles.cache.find(x => x.id === Config.muteRole);
  let logC = guild.channels.cache.find(x => x.id === logChannel);
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}mute`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}mute <@usuario> (tiempo: 1d, 5h, 10m, etc)`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  
  let mUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));

  if(!args[0]) {
    return message.channel.send(embed);
  }
  
  if(!args[1]){ // Para siempre
    if(mUser.roles.find(x => x.id === staffRole)){
      return console.log(`Staff, no....`);
    }

    let mEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Mute`, author.displayAvatarURL())
    .setDescription(`**—** Usuario muteado: ${mUser}
    **—** Muteado por: ${author}`)
    .setColor(Colores.rojo);

    mUser.roles.add(muteRole).then(x => message.react("✅"));
    return logC.send(mEmbed);

  } else { // Temp Mute
    let mTime = args[1]
    if(mUser.roles.cache.find(x => x.id === staffRole)){
      return console.log(`Staff`);
    }

    let mEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Temp mute`, author.displayAvatarURL())
    .setDescription(`**—** Usuario muteado: ${mUser}
**—** Tiempo de mute: ${mTime}
**—** Muteado por: ${author}`)
    .setColor(Colores.rojo);

    mUser.roles.add(muteRole).then(x => message.react("✅"));
    logC.send(mEmbed);

    setTimeout(function(){
      mUser.roles.remove(muteRole);
      let umEmbed = new Discord.MessageEmbed()
      .setAuthor(`| Unmute`, author.displayAvatarURL())
      .setDescription(`**—** Usuario desmuteado: ${mUser}
**—** Tiempo de mute: ${mTime}`)
      .setColor(Colores.verde);
      
      logC.send(umEmbed);
    }, ms(`${mTime}`));
  }
}

module.exports.help = {
    name: "mute"
}
