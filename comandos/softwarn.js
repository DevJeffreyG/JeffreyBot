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

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
    
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

  // Get the size of an object
  var size = Object.size(reglas);

  let rule = reglas[args[1]] || "na";
  let note = args.join(" ").slice(args[0].length + args[1].length + 2) || "na";

  //errores
  let rulesEmbed = new Discord.MessageEmbed()
  .setColor(Colores.nocolor)
  .setDescription(`▸ Usa el comando como \`${prefix}softwarn ${member.id} <N° Regla>\`.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}swarn`);
  //agregar cada regla de la variable de reglas
  for(let i = 1; i <= size; i++){
      rulesEmbed.addField(reglas[i], `N° **${i}**`);
  }

  let alreadyWarned = new Discord.MessageEmbed()
  .setAuthor(`| Error`, guild.iconURL())
  .setColor(Colores.rojo)
  .setDescription(`**—** **${member.user.tag}** ya ha sido softwarneado por infringir la regla N°${args[1]}: \`${rule}\`.
**—** Proceder con \`${prefix}warn\`.`);

  if(rule === "na") return message.channel.send(rulesEmbed);

  SoftWarn.findOne({
      userID: member.id
  }, (err, swarn) =>  {
        if(err) throw err;

        // confirmación madre mia
        let confirmation = new Discord.MessageEmbed()
        .setAuthor(`| Softwarn?`, guild.iconURL())
        .setDescription(`\`▸\` ¿Estás seguro de softwarnear a **${member.user.tag}**?
        \`▸\` Razón: Infringir la regla N°${args[1]} (${rule})`)
        .setColor(Colores.verde);

        message.channel.send(confirmation).then(msg => {
            msg.react(":allow:558084462232076312")
            .then(r => {
                msg.react(":denegar:558084461686947891");
            });

            let cancelEmbed = new Discord.MessageEmbed()
              .setDescription(`Cancelado.`)
              .setColor(Colores.nocolor);

            const yesFilter = (reaction, user) => reaction.emoji.id === "558084462232076312" && user.id === message.author.id;
            const noFilter = (reaction, user) => reaction.emoji.id === "558084461686947891" && user.id === message.author.id;

            const yes = msg.createReactionCollector(yesFilter, { time: 60000 });
            const no = msg.createReactionCollector(noFilter, { time: 60000 });

            yes.on("collect", r => {
              
                if(!swarn){
                    const newSoft = new SoftWarn({
                        userID: member.id,
                        warns: {
                            "rule": rule,
                            "note": note
                        }
                    });

                    newSoft.save();
                } else {
                    for(let i = 0; i < swarn.warns.length; i++){
                        if(swarn.warns[i].rule === rule){
                            return message.channel.send(alreadyWarned);
                        }
                    }
        
                    swarn.warns.push({"rule": rule, "note": note});
                    swarn.save();
                }

                let warnedEmbed = new Discord.MessageEmbed()
                .setAuthor(`| SOFTWarn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
                .setDescription(`
      **—** Has sido __SOFTwarneado__ por el STAFF.
      **—** Por infringir la regla: **${rule}**.`)
                .setColor(Colores.rojo)
                .setFooter(`Si vuelves a cometer otra falla serás warneado, ten cuidado.`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
                
                member.send(warnedEmbed)
                .catch(e => {
                  console.log('Tiene los MDs desactivados.')
                });
              
              let warned = new Discord.MessageEmbed()
              .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
              .setDescription(`**—** Softwarneado: **${member}**.
**—** Mod: **${author.user.tag}**
**—** Canal: **${message.channel}**.
**—** Por infringir la regla: **${rule}**.`)
          .setColor(Colores.rojo);

              return msg.edit(warned).then(() => {
                msg.reactions.removeAll();
              });
            });

            no.on("collect", r => {
              return msg.edit(cancelEmbed).then(a => {
                msg.reactions.removeAll();
                message.delete();
                a.delete({timeout: ms("20s")});
              });
            });
          });

  })
}

module.exports.help = {
    name: "softwarn",
    alias: "swarn"
}
