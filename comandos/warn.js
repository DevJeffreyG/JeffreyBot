const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const reglas = require("./../resources/reglas.json");
const Discord = require("discord.js");
const ms = require("ms");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Warn = require("../modelos/warn.js");
const SoftWarn = require("../modelos/softwarn.js");
const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let logC = guild.channels.cache.find(x => x.id === Config.logChannel);

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    logC = guild.channels.cache.find(x => x.id === "483108734604804107");
  }
  
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}warn`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}warn <@usuario> <N° Regla> (nota adicional) \n▸ Warneas a alguien.\n▸ Reglas:`)
  .setFooter(`<> Obligatorio () Opcional`);
    
  // Get the size of an object
  var size = Object.keys(reglas).length;

  //agregar cada regla de la variable de reglas
  for(let i = 1; i <= size; i++){
    embed.addField(reglas[i], `N° **${i}**`);
  }

  if(!args[0]) return message.channel.send({embeds: [embed]});
  if(!args[1]) return message.channel.send({embeds: [embed]});

      

      let wUser = message.mentions.users.first() ? guild.members.cache.get(message.mentions.users.first().id) : guild.members.cache.get(args[0]);
      let rule = reglas[args[1]] || "na";
      let notes = args.join(" ").slice(args[0].length + args[1].length + 2) || "Recuerda leer siempre las reglas";

      if(wUser.roles.cache.find(x => x.id === staffRole.id) && message.author.id != Config.jeffreygID){
        return message.reply("¿tas bobo o qué?");
      }

      if(rule === "na") return message.channel.send({embeds: [embed]});

      Warn.findOne({
        userID: wUser.id
      }, (err, warns) => {
        if(err) throw err;

         // confirmación madre mia
         let confirmation = new Discord.MessageEmbed()
         .setAuthor(`| Warn?`, guild.iconURL())
         .setDescription(`\`▸\` ¿Estás seguro de warnear a **${wUser.user.tag}**?
         \`▸\` Razón: Infringir la regla N°${args[1]} (${rule})
         \`▸\` Notas: \`${notes}\`.`)
         .setColor(Colores.verde);

         // ERROR
         let errorEmbed = new Discord.MessageEmbed()
         .setAuthor(`| Error`, Config.errorPng)
         .setDescription(`\`▸\` **${wUser.user.tag}** no tiene el softwarn para poder ser warneado.
         \`▸\` Softwarn necesario: Regla N°${args[1]} (${rule})`)
         .setColor(Colores.rojo);
 
         message.channel.send({embeds: [confirmation]}).then(msg => {
            msg.react(":allow:558084462232076312")
            .then(r => {
                msg.react(":denegar:558084461686947891");
            });

            let cancelEmbed = new Discord.MessageEmbed()
              .setDescription(`Cancelado.`)
              .setColor(Colores.nocolor);

            const yesFilter = (reaction, user) => reaction.emoji.id === "558084462232076312" && user.id === message.author.id;
            const noFilter = (reaction, user) => reaction.emoji.id === "558084461686947891" && user.id === message.author.id;
            const collectorFilter = (reaction, user) => (reaction.emoji.id === "558084462232076312" || reaction.emoji.id === "558084461686947891") && user.id === message.author.id;

            const yes = msg.createReactionCollector({ filter:yesFilter, time: 60000 });
            const no = msg.createReactionCollector({ filter:noFilter, time: 60000 });
            const collector = msg.createReactionCollector({ filter:collectorFilter, time: 60000 });
 
            collector.on("collect", r => {
              collector.stop();
            });

            collector.on("end", r => {
              if(r.size > 0 && (r.size === 1 && r.first().me)) return;
              return msg.edit({embeds: [cancelEmbed]}).then(a => {
                msg.reactions.removeAll().then(() => {
                  msg.react("795090708478033950");
                });
                message.delete();
                setTimeout(() => {
                  a.delete()
                }, ms("20s"));
              });
            });

            yes.on("collect", async r => {
              if(!warns){
                
                // revisar si tiene el softwarn
                SoftWarn.findOne({
                  userID: wUser.id
                }, (err, soft) => {
                    if (err) throw err;
                    let existsSoft = false;

                    if(!soft) return msg.edit({embeds: [errorEmbed]}).then(() => msg.reactions.removeAll());

                    for (let i = 0; i < soft.warns.length; i++){ // revisar cada soft
                      if(soft.warns[i].rule === rule){ // si existe
                        existsSoft = true;
                      }

                      if(existsSoft === true){
                        i = soft.warns.length - 1;
                      }
                    }
                    
                    if(existsSoft === false) return msg.edit({embeds: [errorEmbed]}).then(() => msg.reactions.removeAll());

                  const newWarn = new Warn({
                    userID: wUser.id,
                    warns: 1
                  })

                  newWarn.save()
                  .then(() => msg.reactions.removeAll())
                  .catch(e => console.log(e));
                    message.react("✅");
                  
                  let warnedEmbed = new Discord.MessageEmbed()
                  .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
                  .setDescription(`
        **—** Has sido __warneado__ por el STAFF.
        **—** Warns actuales: **1**.
        **—** Por infringir la regla: **${rule}**.
        **—** Notas / observaciones: **${notes}**.`)
                  .setColor(Colores.rojo)
                  .setFooter(`Ten más cuidado la próxima vez!`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
                  
                  wUser.send({embeds: [warnedEmbed]})
                  .catch(e => {
                    message.react("494267320097570837");
                    message.channel.send("¡Usuario con MDs desactivados! **¡No sabe cuántos WARNS tiene!**");
                  });
                })
              } else { // ya tiene el documento de los warns
                // revisar si tiene el softwarn
                SoftWarn.findOne({
                  userID: wUser.id
                }, async (err, soft) => {
                  if (err) throw err;
                  let existsSoft = false;

                  if(!soft) return msg.edit({embeds: [errorEmbed]}).then(() => msg.reactions.removeAll());

                  for (let i = 0; i < soft.warns.length; i++){ // revisar cada soft
                    if(soft.warns[i].rule === rule){ // si existe
                      existsSoft = true;
                    }

                    if(existsSoft === true){
                      i = soft.warns.length - 1;
                    }
                  }
                  
                  if(existsSoft === false) return msg.edit({embeds: [errorEmbed]}).then(() => msg.reactions.removeAll());

                  warns.warns = warns.warns + 1;
                  warns.save()
                  .then(() => msg.reactions.removeAll())
                  .catch(e => console.log(e));
                  
                  // acciones de automod
                  if(warns.warns >= 4){
                    let autoMod = new Discord.MessageEmbed()
                    .setAuthor(`| Ban PERMANENTE.`, "https://cdn.discordapp.com/emojis/537804262600867860.png")
                    .setDescription(`**—** Baneado: **${wUser}**.
          **—** Warns actuales: **${warns.warns}**.
          **—** Razón de ban (AutoMod): Muchos warns.
          **—** Último warn por infringir la regla: **${rule}**.`)
                    .setColor(Colores.rojo);

                    logC.send({embeds: [autoMod]});
                    await wUser.send({embeds: [autoMod]})
                    wUser.ban({reason: `AutoMod. (Infringir "${rule}")`});
                  } else

                  if(warns.warns >= 3){
                    let autoMod = new Discord.MessageEmbed()
                    .setAuthor(`| TempBan`, "https://cdn.discordapp.com/emojis/537792425129672704.png")
                    .setDescription(`**—** Ban (24h): **${wUser}**.
          **—** Warns actuales: **${warns.warns}**.
          **—** Razón de ban (AutoMod): 3 warns acumulados.
          **—** Último warn por infringir la regla: **${rule}**.`)
                    .setColor(Colores.rojo);
                    

                    await wUser.send({embeds: [autoMod]});
                    wUser.ban({reason: `AutoMod. (Infringir "${rule}")`});
                    

                    GlobalData.findOne({
                      "info.type": "temporalGuildBan",
                      "info.userID": wUser.id,
                      "info.serverID": guild.id
                    }, (err, guildBan) => {
                      if(err) throw err;

                      let now = new Date();

                      if(!guildBan){
                        const newBan = new GlobalData({
                          info: {
                            type: "temporalGuildBan",
                            userID: wUser.id,
                            serverID: guild.id,
                            reason: `AutoMod. (Infringir "${rule}")`,
                            since: now,
                            duration: ms("1d")
                          }
                        });

                        newBan.save();
                      } else {
                        // si ya existe (how) cambiar el since
                        guildBan.info.since = now;
                        guildBan.save();

                      }

                      setTimeout(function() {
                        guild.unban(wUser.id)
                      }, ms("1d"));
                    })
                    
                    logC.send({embeds: [autoMod]});
                  } else

                  if(warns.warns >= 2){
                    let infoEmbed = new Discord.MessageEmbed()
                    .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png?v=1")
                  .setDescription(`**—** ${wUser.user.tag}, este es tu **warn número ❛ \`2\` ❜**
        *— ¿Qué impacto tendrá este warn?*
        **—** Tranquilo. Este warn no afectará en nada tu estadía en el servidor, sin embargo; el siguiente warn será un **ban de un día**.
        **—** Te sugiero comprar un **-1 Warn** en la tienda del servidor. *( \`${prefix}shop\` para más info de precios, etc. )*`)
                  .setColor(Colores.rojo);
                    
                    await wUser.send({embeds: [infoEmbed]});
                  }

                message.react("✅");
                  
                  // embed que se le envía al usuario por el warn
                  let warnedEmbed = new Discord.MessageEmbed()
                  .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
                  .setDescription(`
        **—** Has sido __warneado__ por el STAFF.
        **—** Warns actuales: **${warns.warns}**.
        **—** Por infringir la regla: **${rule}**.
        **—** Notas / observaciones: **${notes}**.`)
                  .setColor(Colores.rojo)
                  .setFooter(`Ten más cuidado la próxima vez!`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
                  
                  wUser.send({embeds: [warnedEmbed]})
                  .catch(e => {
                    message.react("494267320097570837");
                    message.channel.send("¡Usuario con MDs desactivados // Usuario no encontrado! **¡No sabe cuántos WARNS tiene!**");
                  });
                })
              }

              // quitar el softwarn
              SoftWarn.findOne({
                userID: wUser.id
              }, (err, swarns) => {
                if (err) throw err;

                for (let i = 0; i < swarns.warns.length; i++){
                  if(swarns.warns[i].rule === rule){

                    swarns.warns.splice(i, 1);
                    swarns.save();

                  }
                }
              })

              // embed a editar el mensaje de confirmación
              // await para saber los warns actuales porque esta mamada no sirve por alguna razón
              let query = await Warn.findOne({
                userID: wUser.id
              });

              let numWarns = query ? query.warns + 1 : 1;
              let wEmbed = new Discord.MessageEmbed()
              .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
              .setDescription(`**—** Warneado: **${wUser}**.
    **—** Canal: **${message.channel}**.
    **—** Warns actuales: **${numWarns}**.
    **—** Por infringir la regla: **${rule}**.
    **—** Nota adjunta: \`${notes}\`.`)
              .setColor(Colores.rojo);

              return msg.edit({embeds: [wEmbed]});
             });

             no.on("collect", r => {
              return msg.edit({embeds: [cancelEmbed]}).then(a => {
                msg.reactions.removeAll();
                message.delete();
                setTimeout(() => {
                  a.delete()
                }, ms("20s"));
              });
             })
          })
    })
}

module.exports.help = {
    name: "warn"
}
