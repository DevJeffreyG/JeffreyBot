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
const Roles = require("../modelos/pRole.js");

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
  .setAuthor(`| Personalizando tu rol`, guild.iconURL())
  .setColor(Colores.verde)
  .setDescription(`**—** ¡Hola! Aquí puedes personalizar **tu** rol :D
**—** Para ver lo que puedes personalizar sólo has \`${prefix}myrole configs\`.`);
  
  if(!args[0]){
    return message.channel.send(embed);
  }
  
  let subComando = args[0].toLowerCase();
  
  let configs = new Discord.MessageEmbed()
  let helpEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Mi rol - Configuraciones`, guild.iconURL()) 
  .setDescription(`**—** \`${prefix}myrole create\`: Si ya eres nivel <@&${Config.lvl100}> usa este commando para recibir tu rol.

**—** \`${prefix}myrole color\`: Cambias el color de tu rol.

**—** \`${prefix}myrole name\`: Puedes cambiar como se ve tu rol, pero siempre deberá llevar tu nombre de usuario.`)
      .setColor(Colores.verde);
  
  let sColor = new Discord.MessageEmbed()
  .setDescription(`Usa el tipo [HEX Color](https://htmlcolorcodes.com/es/) para determinar el tuyo. \`${prefix}myrole color #hex\`.`)
  .setColor(Colores.verde);
  
  let sName = new Discord.MessageEmbed()
  .setDescription(`Para cambiar el nombre del rol, deberá tener la etiqueta {nombre}. Ejemplos: \`⇝ {nombre}\`, \`💚 {nombre} 💚\`.`)
  .setColor(Colores.verde);
  
  let cancelE = new Discord.MessageEmbed()
  .setDescription(`Cancelado.`)
  .setColor(Colores.rojo);
  
    const filter = m => m.author.id === author.id;

  Roles.findOne({
    userID: author.id
  }, (err, roles) => {
    if(err) throw err;
    
    if(subComando === 'configs'){
      return message.channel.send(helpEmbed);
    } else
      
    if(subComando === 'create'){
       if(!roles || !message.member.roles.cache.find(x => x.id === Config.lvl100)){
         return message.reply(`No puedes crear tu rol personalizado porque aún no tienes <@&${Config.lvl100}>.
*Si compraste tu rol con \`${prefix}shop\`, para obtenerlo debes usar el comando \`${prefix}use 3\`.*`).then(m => m.delete(ms('30s')));
       } else {
         if(!roles){
           let newRoleID;
           let member = message.guild.member(author.id);
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
           });
         } else {
           return message.reply(`Ya tienes tu rol creado. Si por alguna razón no lo tienes, pide ayuda al staff ➟ <#${Config.supportChannel}>.`).then(m => m.delete(ms('30s')));
         }
       }
    } else
    
    if(subComando === 'color'){
      if(!args[1]) return message.channel.send(sColor);
            
      
      var isHexcolor = require('is-hexcolor')
 
      if(!isHexcolor(args[1])) {
        return message.channel.send(sColor);
      } else {
      
      message.guild.roles.cache.find(x => x.id === roles.roleID).setColor(args[1])
      .then(updated => console.log(`Set color of role to ${updated.color}`))
      .catch(err => message.reply(`Algo a ocurrido, creo que no tienes tu rol aún... \`${prefix}myrole create\`.`));
      return message.react('558084462232076312');
      }
    } else
    
    if(subComando === 'name' || subComando === 'nombre'){
      if(!args[1]){
        message.channel.send(sName).then(selectingName => {
          message.channel.awaitMessages(filter, {max: 1, time: ms('5m')}).then(collectedName => {
            if(collectedName.first().content.toLowerCase() === "cancel" || collectedName.first().content.toLowerCase() === "cancelar"){
              collectedName.first().delete();
              return selectingName.edit(cancelE).then(r => r.delete(5000));
            }

            if(!collectedName.first().content.includes("{nombre}")){
              return message.reply(`Debes usar la etiqueta \`{nombre}\` para poder cambiar el nombre de tu rol.`)
            } else {
            let str = collectedName.first().content;
            let finalName = str.replace(new RegExp('{nombre}', "g"), `${author.username}`);

              console.log(finalName);

            let myRole2 = guild.roles.cache.find(x => x.id === roles.roleID);
            myRole2.setName(`${finalName}`).then(a => {
                collectedName.react('558084462232076312');
              })
            }
          }).catch(e => message.reply(`Han pasado los 5 minutos, o no tienes tu rol creado aún. \`${prefix}myrole create\`.`));
        })
      } else {
            if(!message.content.includes("{nombre}")){
              return message.reply(`Debes usar la etiqueta \`{nombre}\` para poder cambiar el nombre de tu rol.`)
            } else {
            let str = args.join(" ").slice(args[0].length + 1);
            let finalName = str.replace(new RegExp('{nombre}', "g"), `${author.username}`);

              console.log(finalName);

            let myRole2 = guild.roles.cache.find(x => x.id === roles.roleID);
            myRole2.setName(`${finalName}`).then(a => {
                message.react('558084462232076312');
              })
              .catch(err => message.reply(`Algo a ocurrido, creo que no tienes tu rol aún... \`${prefix}myrole create\`.`));
            }
      }
    }
  })

}

module.exports.help = {
    name: "myrole",
    alias: "mirol"
}
