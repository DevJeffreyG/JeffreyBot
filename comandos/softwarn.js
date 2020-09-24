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
const SoftWarn = require("../modelos/softwarn.js");
const Banned = require("../modelos/banned.js");
const autorole = require("../modelos/autorole");

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
  .setTitle(`Ayuda: ${prefix}softwarn`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}softwarn <@usuario> <regla infringida> (alguna nota / observación) \n▸ Usar este comando cuando se le advierta a un usuario por chat.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}swarn`);

  if(!args[0]) return message.channel.send(embed);
  if(!args[1]) return message.channel.send(embed);

  let member = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));

  //determinar regla infringida
  let reglas = {
      "1": "Sentido común",
      "2": "No Contenido NSFW / Comportamiento respetuoso",
      "3": "Uso correcto de canales",
      "4": "Problemas personales",
      "5": "Mencionar sólo cuando sea necesario",
      "6": "No Flood / Spam",
      "7": "Uso correcto de nicknames"
  }

  let rule = reglas[args[1]] || "na";
  let note = args.join(" ").slice(args[0].length + args[1].length + 2) || "na";

  //errores
  let rulesEmbed = new Discord.MessageEmbed()
  .setColor(Colores.nocolor)
  .setDescription(`▸ Usa el comando como \`${prefix}softwarn ${member} <N° Regla>\`.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}swarn`);
  //agregar cada regla de la variable de reglas
  for(let i = 1; i === reglas.length; i++){
      rulesEmbed.addField(reglas[i], `N° **${i}**`);
      console.log(rulesEmbed);
  }

  let alreadyWarned = new Discord.MessageEmbed()
  .setAuthor(`| Error`, guild.iconURL())
  .setColor(Colores.rojo)
  .setDescription(`**—** **${member.user.tag}** ya ha sido softwarneado por infringir la regla N°${args[1]}: \`${rule}\`.
**—** Proceder con \`${prefix}warn\`.`);

console.log("$$$$$$$$$$$$$$$$$$$$$$$$2 "+rulesEmbed);

  if(rule === "na") return message.channel.send(rulesEmbed);

  SoftWarn.findOne({
      userID: member.id
  }, (err, swarn) =>  {
        if(err) throw err;

        if(!swarn){
            const newSoft = new SoftWarn({
                userID: member.id,
                warns: {
                    "rule": rule,
                    "note": note
                }
            });

            return newSoft.save();
        } else {
            for(let i = 0; i < swarn.warns.length; i++){
                if(swarn.warns[i].rule === rule){
                    return message.channel.send(alreadyWarned);
                }
            }
        }

        swarn.save();
  })

}

module.exports.help = {
    name: "softwarn",
    alias: "swarn"
}
