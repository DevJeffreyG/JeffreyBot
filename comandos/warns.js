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
const SoftWarn = require("../modelos/softwarn.js");

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
      
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}warns`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}warns <@usuario || ID> \n▸ Ves cuántos warns tiene un usuario.`)
  .setFooter(`<> Obligatorio () Opcional`);
  
  let member = guild.member(message.mentions.users.first()) || message.guild.members.cache.get(args[0]);
  if((!message.member.roles.cache.find(x => x.id === staffRole.id) && !message.member.roles.cache.find(x => x.id === jeffreyRole.id)) || !args[0]) {
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

    console.log(warns);
      SoftWarn.findOne({
        userID: member.id
      }, (err2, soft) => {
        if(err2) throw err;

        if((!soft || soft.warns.length === 0) && (!warns || warns.warns === 0)){
          return message.channel.send(error)
        }

        let n = soft.warns.length || 0;

        let badguy = new Discord.MessageEmbed()
        .setAuthor(`| ${member.user.tag}'s warns`, member.user.displayAvatarURL())
        .setDescription(`**Número de warns ** ❛ \`${warns.warns}\` ❜
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
