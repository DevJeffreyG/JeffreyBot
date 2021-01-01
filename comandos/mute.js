const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const ms = require("ms");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let muteRole = guild.roles.cache.find(x => x.id === Config.muteRole);
  let logC = guild.channels.cache.find(x => x.id === Config.logChannel);

  if(bot.user.id === Config.testingJBID){
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
    Duration("permanent", muteRole.id, mUser);

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
    Duration(ms(mTime), muteRole.id, mUser);

    let mEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Temp mute`, author.displayAvatarURL())
    .setDescription(`**—** Usuario muteado: ${mUser}
**—** Tiempo de mute: ${mTime}
**—** Muteado por: ${author}`)
    .setColor(Colores.rojo);

    mUser.roles.add(muteRole).then(x => message.react("✅"));
    logC.send(mEmbed);
  }

  function Duration(roleDuration, roleID, victimMember){
    let role = guild.roles.cache.find(x => x.id === roleID);
    if(roleDuration != "permanent"){
        // agregar una global data con la fecha

        let hoy = new Date();
        const newData = new GlobalData({
            info: {
                type: "roleDuration",
                roleID: roleID,
                userID: victimMember.id,
                since: hoy,
                duration: roleDuration
            }
        })

        newData.save();

        // timeout, por si pasa el tiempo antes de que el bot pueda reiniciarse
        setTimeout(function(){
            victimMember.roles.remove(role);
            let umEmbed = new Discord.MessageEmbed()
            .setAuthor(`| Unmute`, author.displayAvatarURL())
            .setDescription(`**—** Usuario desmuteado: ${mUser}
      **—** Tiempo de mute: ${mTime}`)
            .setColor(Colores.verde);
            
            logC.send(umEmbed);

            GlobalData.findOneAndDelete({
                "info.type": "roleDuration",
                roleID: roleID,
                userID: victimMember.id
            }, (err, func) => {
                if(err){
                    console.log(err);
                } else {
                    console.log("Role eliminado automaticamente")
                }
            });
        }, roleDuration);

    } else {
        // es permanente, no hacer nada
        return;
    }
}
}

module.exports.help = {
    name: "mute"
}
