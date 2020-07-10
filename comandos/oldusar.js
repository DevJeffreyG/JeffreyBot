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
//const Items = require("../modelos/olditems.js");
const Roles = require("../modelos/pRole.js");


/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;
  if(message.author.id != jeffreygID) return message.reply(`Comando en mantenimiento, vuelve más tarde!`);

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let vipRole = guild.roles.cache.find(x => x.id === Config.vipRole);
  let member = message.guild.member(author.id);
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}usar`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}usar <ID de item>`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}use`);
  
  if(!args[0]) return message.channel.send(embed);
  let useItem = args[0];
  if(isNaN(useItem)) return message.channel.send(embed);
  
  let errorEmbed03 = new Discord.MessageEmbed() // No tienes items.
  .setAuthor(`| Error`, Config.errorPng)
  .setColor(Colores.rojo)
  .setDescription(`
\`▸\` Se ha producido un error: \`03\`.
\`▸\` No tienes ningún item. \`${prefix}shop\` para comprarlos.`);
  
  let errorEmbed04 = new Discord.MessageEmbed() // No tienes este item en específico.
  .setAuthor(`| Error`, Config.errorPng)
  .setColor(Colores.rojo)
  .setDescription(`
\`▸\` Se ha producido un error: \`04\`.
\`▸\` No tienes este item. \`${prefix}shop ${useItem}\` para comprarlo.`);

  Items.findOne({
    userID: author.id
  }, (err, items) => {
    if(err) throw err;
    if(!items){
      return message.channel.send(errorEmbed03);
    } else {
      if(useItem === '1'){
        if(items.mOneWarn === 0){
          return message.channel.send(errorEmbed04);
        }
        
      Warn.findOne({
        userID: author.id
      }, (err, warns) => {
        if(err) throw err;
        if(warns.warns === 0){
          return message.reply(`No puedes usar este item porque no tienes warns.`);
        } else {
          warns.warns = warns.warns - 1;
          warns.save();
          
          items.mOneWarn = items.mOneWarn - 1;
          items.save();
          
          let niceEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Listo`, guild.iconURL())
          .setColor(Colores.verde)
          .setDescription(`
\`▸\` Item usado con éxito.
\`▸\` Ahora tienes: **${warns.warns}** warns.`);
          
          return message.channel.send(niceEmbed);
          
        }
      })
      } else
      if(useItem === '2'){
        if(items.vip === 0){
          return message.channel.send(errorEmbed04);
        } else if(items.vip === 1){
          if(member.roles.find(z => z.id === vipRole.id)){return message.reply("Ya tienes VIP, amigo.");}
          member.roles.add(vipRole).then(a => {
          let niceEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Listo`, guild.iconURL())
          .setColor(Colores.verde)
          .setDescription(`
\`▸\` Item usado con éxito.
\`▸\` ¡Disfruta tu VIP!`);
          
          return message.channel.send(niceEmbed);
          })
        }
      } else
        
      if(useItem === '3'){
        if(items.personalRole === 0){
          return message.channel.send(errorEmbed04);
        } else if(items.personalRole === 1){
          let newRoleID;
          Roles.findOne({
            userID: author.id
          }, (err, role) => {
            if(err) throw err;
            if(!role){
              guild.createRole({
                name: `⇝ ${author.username}`
              }).then(role => {
                newRoleID = role.id;
                guild.setRolePosition(role, 51);
                
                member.roles.add(role).then(s => {
                  let niceEmbed = new Discord.MessageEmbed()
                  .setAuthor(`| Listo`, guild.iconURL())
                  .setColor(Colores.verde)
                  .setDescription(`
\`▸\` Item usado con éxito.
\`▸\` ¡Disfruta tu rol personalizado!
\`▸\` Puedes configurarlo personalizarlo con \`${prefix}myrole\`.`);
                  
                  const newRole = new Roles({
                    userID: author.id,
                    roleID: newRoleID
                  });
                  
                  newRole.save()
                  .catch(e => console.log(e));
          
                  return message.channel.send(niceEmbed);
                })
              })
            } else if(!member.roles.find(x => x.id === role.roleID)){
              member.roles.add(role.roleID).then(i => {
                let niceEmbed = new Discord.MessageEmbed()
                .setAuthor(`| Listo`, guild.iconURL())
                .setColor(Colores.verde)
                .setDescription(`
\`▸\` Item usado con éxito.
\`▸\` ¡Disfruta tu rol personalizado!
\`▸\` Puedes configurarlo personalizarlo con \`${prefix}myrole\`.`);
                
                return message.channel.send(niceEmbed);
              })
            } else {
              return message.reply("Ya tienes un rol personalizado.");
            }
          })
        }
      }
    }
  })
  
}

module.exports.help = {
    name: "usar",
    alias: "use"
}
