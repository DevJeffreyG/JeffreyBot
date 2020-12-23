const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Warn = require("../modelos/warn.js");
const SoftWarn = require("../modelos/softwarn.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(bot.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }
      
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}warns`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}warns <@usuario || ID> \n▸ Ves cuántos warns tiene un usuario.`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  let member = guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
  if(!message.member.roles.cache.find(x => x.id === staffRole.id) || !args[0]) {
    member = message.member;
  }
  if(!member) return message.channel.send(embed);
  
  let error = new Discord.MessageEmbed()
  .setColor(Colores.rojo)
  .setDescription(`Este usuario no tiene warns :D`);
  
  Warn.findOne({
    userID: member.id
  }, (err, warns) => {
    if(err) throw err;

      SoftWarn.findOne({
        userID: member.id
      }, (err2, soft) => {
        if(err2) throw err;

        if((!soft || soft.warns.length === 0) && (!warns || warns.warns < 0)){
          return message.channel.send(error)
        }

        let w;
        if(!warns){
          w = 0;
        } else {
          w = warns.warns;
        }

        let n;
        if(!soft){
          n = 0;
        } else {
          n = soft.warns.length;
        }

        let badguy = new Discord.MessageEmbed()
        .setAuthor(`| ${member.user.tag}'s warns`, member.user.displayAvatarURL())
        .setDescription(`**Número de warns ** ❛ \`${w}\` ❜
        **Número de Softwarns —** ❛ \`${n}\` ❜ ¬¬`)
        .setColor(Colores.verde);
        
        if (n != 0){
          for (let i = 0; i < n; i++){
            badguy.addField(`${i + 1} — ${soft.warns[i].rule}`, `**— Nota: ${soft.warns[i].note}**\n*El número que sale NO es el número de la regla, es la id del softwarn.*`)
          }
        }

        return message.channel.send(badguy);
      })
      
  })

}

module.exports.help = {
    name: "warns"
}
