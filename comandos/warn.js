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
  let logC = guild.channels.cache.find(x => x.id === Config.logChannel);  
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}warn`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}warn <@usuario> <N° de warns> (razón) \n▸ Warneas a alguien.`)
  .setFooter(`<> Obligatorio () Opcional`);
  
      let numWarns = Math.floor(args[1]);
      if(!args[1]) return message.channel.send(embed);
      if(isNaN(args[1])) return message.channel.send(embed);

      let wUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
      if(!args[0]) return message.channel.send(embed);

      let wRazon;

      if(wUser.roles.cache.find(x => x.id === staffRole.id)){
        return message.reply("¿tas bobo o qué?");
      }
  
      if(!args[2]){
        wRazon = "Sin especificar.";
      } else {
        wRazon = args.join(" ").slice(args[0].length + 1 + args[1].length + 1);
      }

      Warn.findOne({
        userID: wUser.id
      }, (err, warns) => {
        if(err) throw err;

        if(!warns){

          const newWarn = new Warn({
            userID: wUser.id,
            warns: numWarns
          })

          newWarn.save()
          .catch(e => console.log(e));
            message.react("✅");

          let wEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
          .setDescription(`**—** Warneado: **${wUser}**.
**—** Canal: **${message.channel}**.
**—** Warns actuales: **${numWarns}**.
**—** Warns por última vez: **${numWarns}**.
**—** Razón: **${wRazon}**.`)
          .setColor(Colores.rojo);

          logC.send(wEmbed);
          
          let warnedEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
          .setDescription(`
**—** Has sido __warneado__ por el STAFF.
**—** Warns actuales: **${numWarns}**.
**—** Razón de warn: **${wRazon}**.`)
          .setColor(Colores.rojo)
          .setFooter(`Ten más cuidado la próxima vez!`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
          
          wUser.send(warnedEmbed)
          .catch(e => {
            console.log('Tiene los MDs desactivados.')
          });

        } else {
          warns.warns = warns.warns + numWarns;
          warns.save()
          .catch(e => console.log(e));

          let wEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
          .setDescription(`**—** Warneado: **${wUser}**.
**—** Canal: **${message.channel}**.
**—** Warns actuales: **${warns.warns}**.
**—** Warns por última vez: **${numWarns}**.
**—** Razón: **${wRazon}**.`)
          .setColor(Colores.rojo);

          logC.send(wEmbed);
          
          if(warns.warns === 2){
            let infoEmbed = new Discord.MessageEmbed()
            .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png?v=1")
          .setDescription(`**—** ${wUser.user.tag}, este es tu **warn número ❛ \`2\` ❜**
*— ¿Qué impacto tendrá este warn?*
**—** Tranquilo. Este warn no afectará en nada tu estadía en el servidor, sin embargo; el siguiente warn será un **ban de un día**.
**—** Te sugiero comprar un **-1 Warn** en la tienda del servidor. *( \`${prefix}shop items\` para más info de precios, etc. )*`)
          .setColor(Colores.rojo);
            
            wUser.send(infoEmbed);
          }
          /*if(warns.warns == 2){
          let muteTime = "6h";
          wUser.roles.add(muteRole);
          let autoMod = new Discord.MessageEmbed()
          .setAuthor(`| Temp Mute`, "https://cdn.discordapp.com/emojis/537800614575472640.png")
          .setDescription(`**—** Muteado: **${wUser}**.
**—** Warns actuales: **${warns.warns}**.
**—** Warn por última vez: **${numWarns}**.
**—** Tiempo de Mute: **${muteTime}**.
**—** Razón de mute (AutoMod): **${wRazon}**.`)
          .setColor(Colores.rojo);

          logC.send(autoMod);

          setTimeout(function(){
            wUser.roles.remove(muteRole)
          }, ms(muteTime))
        } else*/

        if(warns.warns == 3){
          let autoMod = new Discord.MessageEmbed()
          .setAuthor(`| TempBan`, "https://cdn.discordapp.com/emojis/537792425129672704.png")
          .setDescription(`**—** Ban (24h): **${wUser}**.
**—** Warns actuales: **${warns.warns}**.
**—** Warn por última vez: **${numWarns}**.
**—** Razón de ban (AutoMod): **${wRazon}**.`)
          .setColor(Colores.rojo);
          

          wUser.send(autoMod);
          wUser.ban(`AutoMod. (${wRazon})`);
          
          setTimeout(function() {
            guild.unban(wUser.id)
          }, ms("1d"));
          
          logC.send(autoMod);
        } else

        if(warns.warns == 4){
          let autoMod = new Discord.MessageEmbed()
          .setAuthor(`| Ban PERMANENTE.`, "https://cdn.discordapp.com/emojis/537804262600867860.png")
          .setDescription(`**—** Baneado: **${wUser}**.
**—** Warns actuales: **${warns.warns}**.
**—** Warn por última vez: **${numWarns}**.
**—** Razón de ban (AutoMod): **${wRazon}**.`)
          .setColor(Colores.rojo);

          logC.send(autoMod);
          wUser.send(autoMod)
        }
          
        message.react("✅")
          
          let warnedEmbed = new Discord.MessageEmbed()
                    .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
          .setDescription(`
**—** Has sido __warneado__ por el STAFF.
**—** Warns actuales: **${warns.warns}**.
**—** Razón de warn: **${wRazon}**.`)
          .setColor(Colores.rojo)
          .setFooter(`Ten más cuidado la próxima vez!`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
          
          wUser.send(warnedEmbed)
          .catch(e => {
            message.react("494267320097570837");
            message.channel.send("¡Usuario con MDs desactivados! **¡No sabe cuántos WARNS tiene!**");
          });
          
          wUser.ban(`AutoMod. (${wRazon})`);
          
        }
    })
}

module.exports.help = {
    name: "warn"
}
