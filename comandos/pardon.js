const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const reglas = require("./../resources/reglas.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const ms = require("ms");

/* ##### MONGOOSE ######## */

const Warn = require("../modelos/warn.js");
const SoftWarn = require("../modelos/softwarn.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let logC = guild.channels.cache.find(x => x.id === Config.logChannel);

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    logC = guild.channels.cache.find(x => x.id === "483108734604804107");
  }

  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}pardon`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}pardon <@usuario> (N° de Warns a restar.) (n°regla en softwarn)`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}unwarn`);

  var size = Object.keys(reglas).length;

  let rulesEmbed = new Discord.MessageEmbed()
  .setColor(Colores.nocolor)
  .setDescription(`▸ Usa el comando como \`${prefix}pardon <@usuario> (N° de Warns a restar.) (N° Regla)\`.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}swarn`);
  //agregar cada regla de la variable de reglas
  for(let i = 1; i <= size; i++){
      rulesEmbed.addField(reglas[i], `N° **${i}**`);
  }
  
  let wUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
  let numW;
  let softW = args[2] || undefined;

  if(!wUser) return message.channel.send(embed);
  
  if(!args[1]){
    numW = 1;
  } else {
    numW = args[1];
  }
  
  let rule = reglas[softW] || "na";
  if(rule === "na" && args[2]) return message.channel.send(rulesEmbed);

  if(softW){
    //confirmacion madre mia
    let confirmationSoft = new Discord.MessageEmbed()
    .setAuthor(`| SoftWarn Pardon?`, guild.iconURL())
    .setDescription(`\`▸\` ¿Estás seguro de restar un **softwarn** a **${wUser.user.tag}**?
    \`▸\` Regla: Regla N°${args[2]} (${rule}).`)
    .setColor(Colores.verde);

    message.channel.send(confirmationSoft).then(msg => {
            msg.react(":allow:558084462232076312")
            .then(r => {
              msg.react(":denegar:558084461686947891");
            });
 
            let cancelEmbed = new Discord.MessageEmbed()
            .setDescription(`Cancelado.`)
            .setColor(Colores.nocolor);
 
            const yesFilter = (reaction, user) => reaction.emoji.id === "558084462232076312" && user.id === message.author.id;
            const noFilter = (reaction, user) => reaction.emoji.id === "558084461686947891" && user.id === message.author.id;
            const collectorFilter = (reaction, user) => (reaction.emoji.id === "558084461686947891" || reaction.emoji.id === "558084462232076312") && user.id === message.author.id;

            const yes = msg.createReactionCollector(yesFilter, { time: 60000 });
            const no = msg.createReactionCollector(noFilter, { time: 60000 });
            const collector = msg.createReactionCollector(collectorFilter, { time: 60000 });

            yes.on("collect", r => {
              // quitar el softwarn
              SoftWarn.findOne({
                userID: wUser.id
              }, async (err, swarns) => {
                if (err) throw err;

                let noSofts = new Discord.MessageEmbed()
                .setAuthor(`| Error`, Config.errorPng)
                .setDescription(`**—** ${wUser.tag} no tiene el softwarn "${rule}".`)
                .setColor(Colores.rojo);

                if(swarns.warns.length == 0) {
                  msg.edit(noSofts);
                  msg.reactions.removeAll();
                }

                for (let i = 0; i < swarns.warns.length; i++){
                  if(swarns.warns[i].rule === rule){

                    swarns.warns.splice(i, 1);
                    swarns.save().then(() =>
                      message.react("✅")
                    )

                    let sEmbed = new Discord.MessageEmbed()
                    .setAuthor(`| ¿Me perd0nas?`, "https://cdn.discordapp.com/emojis/537004318667177996.png")
                    .setDescription(`**—** Miembro: ${wUser}
              **—** SOFTWarn actuales: **${swarns.warns.length}**.
              **—** Mod: ${author}`)
                    .setColor(Colores.verde);

                    msg.edit(sEmbed);
                    msg.reactions.removeAll()
                    
                    let sunwarnedEmbed = new Discord.MessageEmbed()
                    .setAuthor(`| Pardon`, "https://cdn.discordapp.com/emojis/537004318667177996.png")
                    .setDescription(`
          **—** Has sido perdonado. =)
          **—** SOFTWarns actuales: **${swarns.warns.length}**.`)
                    .setColor(Colores.verde)
                    .setFooter(`Tienes suerte.`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
                    
                    return wUser.send(sunwarnedEmbed)
                    .catch(e => {
                      console.log('Tiene los MDs desactivados.')
                    });
                  } else { // si no tiene ese
                    if(swarns.warns.length - 1 === i){ // si es el ultimo
                      console.log("Es el ultimo soft que tiene el usuario");
                      msg.edit(noSofts);
                      return msg.reactions.removeAll();
                    }
                  }
                }

                console.log("AHI MUERE LOLXD")
              })
            })

            no.on("collect", r => {
              return msg.edit(cancelEmbed).then(async a => {
                msg.reactions.removeAll();
                message.delete();
                a.delete({timeout: ms("20s")});
              });
            })

            collector.on("collect", r => {
              collector.stop();
            })

            collector.on('end', collected => {
              if(collected.size > 0 && (collected.size === 1 && !collected.first().me)) return;

              return msg.edit(cancelEmbed).then(a => {
                msg.reactions.removeAll().then(() => {
                  msg.react("795090708478033950");
                });
                message.delete();
                a.delete({timeout: ms("20s")});
              });
            });
    })

  } else {
    //confirmacion madre mia
    let confirmation = new Discord.MessageEmbed()
    .setAuthor(`| Pardon?`, guild.iconURL())
    .setDescription(`\`▸\` ¿Estás seguro de restar \`${numW}\` **warn(s)** a **${wUser.user.tag}**?`)
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
      const collectorFilter = (reaction, user) => reaction.emoji.id === ("558084461686947891" || reaction.emoji.id === "558084462232076312") && user.id === message.author.id;

      const yes = msg.createReactionCollector(yesFilter, { time: 60000 });
      const no = msg.createReactionCollector(noFilter, { time: 60000 });
      const collector = msg.createReactionCollector(collectorFilter, { time: 60000 });

      yes.on("collect", r => {
        Warn.findOne({
          userID: wUser.id
        }, (err, warns) => {
          if(err) throw err;

          let noWarn = new Discord.MessageEmbed()
          .setAuthor(`| Error`, Config.errorPng)
          .setDescription(`**—** ${wUser.tag} no tiene warns por quitar.`)
          .setColor(Colores.rojo);
          if(!warns || warns.warns === 0 || warns.warns-numW <= -1){
            msg.edit(noWarn);
            return msg.reactions.removeAll();
          } else {
            warns.warns = warns.warns - numW;
            warns.save().then(() =>
              message.react("✅")
            )
            .catch(e => console.log(e));
            
            let wEmbed = new Discord.MessageEmbed()
            .setAuthor(`| ¿Me perd0nas?`, "https://cdn.discordapp.com/emojis/537004318667177996.png")
            .setDescription(`**—** Miembro: ${wUser}
      **—** Warns actuales: **${warns.warns}**.
      **—** Mod: ${author}`)
            .setColor(Colores.verde);

            msg.edit(wEmbed);
            msg.reactions.removeAll();
            
            let unwarnedEmbed = new Discord.MessageEmbed()
            .setAuthor(`| Pardon`, "https://cdn.discordapp.com/emojis/537004318667177996.png")
            .setDescription(`
  **—** Has sido perdonado. =)
  **—** Warns actuales: **${warns.warns}**.`)
            .setColor(Colores.verde)
            .setFooter(`Tienes suerte.`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
            
            wUser.send(unwarnedEmbed)
            .catch(e => {
              console.log('Tiene los MDs desactivados.')
            });
          }
        })
      })

      no.on("collect", r => {
        return msg.edit(cancelEmbed).then(a => {
          msg.reactions.removeAll();
          message.delete();
          a.delete({timeout: ms("20s")});
        });
      })

      collector.on("collect", r => {
        collector.stop();
      })

      collector.on('end', collected => {
        if(collected.size > 0 && (collected.size === 1 && !collected.first().me)) return;
        
        return msg.edit(cancelEmbed).then(a => {
          msg.reactions.removeAll().then(() => {
            msg.react("795090708478033950");
          });

          message.delete();
          a.delete({timeout: ms("20s")});
        });
      });
    })
  }
}

module.exports.help = {
    name: "pardon",
    alias: "unwarn"
}
