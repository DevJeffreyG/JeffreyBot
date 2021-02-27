const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const ms = require("ms");
const prefix = Config.prefix;
const functions = require("./../resources/functions.js");

/* ##### MONGOOSE ######## */

const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let muteRole = guild.roles.cache.find(x => x.id === Config.muteRole);
  let logC = guild.channels.cache.find(x => x.id === Config.logChannel);

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    muteRole = guild.roles.cache.find(x => x.id === "544691532104728597");
    logC = guild.channels.cache.find(x => x.id === "483108734604804107");
  }
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}mute`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}mute <@usuario> (tiempo: 1d, 5h, 10m, etc)`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

  let mUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));

  if(!args[0]) {
    return message.channel.send(embed);
  }
  
  if(!args[1]){ // Para siempre
    if(mUser.roles.cache.find(x => x.id === staffRole.id)){
      return console.log(`Staff, no....`);
    }

    // llamar la funcion
    functions.LimitedTime(guild, muteRole.id, mUser, "permanent");

    let mEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Mute`, author.displayAvatarURL())
    .setDescription(`**—** Usuario muteado: ${mUser}
    **—** Muteado por: ${author}`)
    .setColor(Colores.rojo);

    mUser.roles.add(muteRole).then(x => message.react("✅"));
    return logC.send(mEmbed);

  } else { // Temp Mute
    let mTime = args[1]
    if(mUser.roles.cache.find(x => x.id === staffRole.id)){
      return console.log(`Staff`);
    }

    // llamar la funcion
    functions.LimitedTime(guild, muteRole.id, mUser, ms(mTime));

    let mEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Temp mute`, author.displayAvatarURL())
    .setDescription(`**—** Usuario muteado: ${mUser}
**—** Tiempo de mute: ${mTime}
**—** Muteado por: ${author}`)
    .setColor(Colores.rojo);

    mUser.roles.add(muteRole).then(x => message.react("✅"));
    logC.send(mEmbed);
  }
}

module.exports.help = {
    name: "mute"
}
