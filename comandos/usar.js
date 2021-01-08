const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const ms = require("ms");

/* ##### MONGOOSE ######## */

const Warn = require("../modelos/warn.js");

const Items = require("../modelos/items.js");
const Purchased = require("../modelos/purchased.js");
const All = require("../modelos/allpurchases.js");
const Use = require("../modelos/use.js");
const Ignore = require("../modelos/ignore.js")
const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let item;

  if(bot.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  // /usar id
  let errorEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Error`, Config.errorPng)
    .setDescription(
      `**—** El uso de este comando es con la id del item que compraste \`${prefix}usar <id>\`.`
    )
    .setColor(Colores.rojo);

  if (!args[0]) return message.channel.send(errorEmbed);

  if (args[0].toLowerCase() === "add") {
    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

    // /usar add <id> <action> <cosa> (id de cosa) (duration) (isSub "true, false") (specialtype) (specialobjective) (specialvalue)
    // /usar   0  1      2        3       4            5               6                  7               8               9
    /*
    
      serverID: String,
      itemID: String, // id en ITEMS.JS
      action: String, // "delete" para quitar X cosa || "add" para agregar X cosa
      thing: String, // "jeffros" || "warns" || "role"
      thingID: String,
      id: Number
  
    */
    let plus = 5325;
    Use.countDocuments({}, (err, c) => {
      Use.findOne(
        {
          id: c + plus
        },
        (err, found) => {
          if (err) throw err;

          if (!found) {
          } else {
            while (c + plus === found.id) {
              c += plus + 1;
              console.log("equal id");
            }
          }

          if (!args[1]) return message.reply(`falta la id.`);
          if (!args[2]) return message.reply(`falta la acción (add o delete).`);
          if (!args[3])
            return message.reply(
              `que se va a agregar o eliminar? (jeffros, warns, role)`
            );

          let cosaID = "na";
          if (args[3].toLowerCase() === "role" && !args[4] || args[3].toLowerCase() === "role" && isNaN(args[4])) {
            return message.reply(`falta la id del role.`);
          } else if (args[3].toLowerCase() === "role") {
            cosaID = args[4];
          }

          let optDuration = false;
          let suscription = false;
          let special = {
            "type": false,
            "specialObjective": false,
            "specialValue": false
          }

          if(args[3].toLowerCase() === "role"){
            optDuration = args[5] ? ms(args[5]) : false;
            suscription = args[6] ? true : false;
            special = {
              "type": args[7] ? args[7] : false,
              "specialObjective": args[8] ? args[8] : false, // exp, jeffros
              "specialValue": args[9] ? args[9] : false // (2) = exp || jeffros normales x 2
            }
          }

          const newUse = new Use({
            serverID: guild.id,
            itemID: args[1],
            action: args[2].toLowerCase(),
            thing: args[3].toLowerCase(),
            thingID: cosaID,
            duration: optDuration,
            isSub: suscription,
            special: special,
            id: c + plus
          });

          newUse.save().catch(e => console.log(e));
          return message.react("✅");
        }
      );
    });
  } else if (args[0].toLowerCase() === "remove") {
    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

    // /usar remove <id>
    Use.findOneAndDelete({
      serverID: guild.id,
      id: args[1]
    });
  } else if (args[0].toLowerCase() === "edit") {
    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

    return message.reply("coming soon.")
  } else if(args[0].toLowerCase() === "cancel") {
    // CANCELAR SUSCRIPCION QUE TENGA EL USUARIO
  } else { // usar normalmente
    Purchased.findOne(
      {
        userID: author.id,
        itemID: args[0]
      },
      (err, purchase) => {
        if (err) throw err;

        Items.findOne(
          {
            serverID: guild.id,
            id: args[0]
          },
          (err, item) => {
            if (err) throw err;

            let noItem = new Discord.MessageEmbed()
              .setAuthor(`| Error`, Config.errorPng)
              .setDescription(`**—** El item con id \`${args[0]}\` no existe.`)
              .setColor(Colores.rojo);

            if (!item) return message.channel.send(noItem);

            let noPurchase = new Discord.MessageEmbed()
              .setAuthor(`| Error`, Config.errorPng)
              .setDescription(`**—** Aún no has comprado \`${item.itemName}\`.`)
              .setColor(Colores.rojo);

            if (!purchase) return message.channel.send(noPurchase);

            /* 
        
          serverID: String,
          itemID: String, // id en ITEMS.JS
          action: String, // "delete" para quitar X cosa || "add" para agregar X cosa
          thing: String, //"warns"
          id: Number
          
        */
            let isIgnored = true;
            if(item.ignoreInterest == false) isIgnored = false;
              
            Use.findOne(
              {
                serverID: guild.id,
                itemID: args[0]
              },
              (err, use) => {
                if (err) throw err;

                let action = use.action;
                let thing = use.thing;
                let duration = use.duration || "na";

                All.findOne(
                  {
                    userID: author.id,
                    itemID: args[0]
                  },
                  (err, all) => {
                    
                    if(!all && !isIgnored) {
                      const newAll = new All({
                        userID: author.id,
                        itemID: args[0],
                        quantity: 1
                      })
                      
                      newAll.save();
                    } else if(!isIgnored){
                      all.quantity += 1;
                      all.save()
                    }
                    
                    if (thing === "warns") {
                      Warn.findOne(
                        {
                          userID: author.id
                        },
                        (err, warns) => {
                          if (err) throw err;

                          if (action === "delete") {
                            if (warns.warns === 0)
                              return message.reply(
                                `no puedes usar este item porque no tienes warns que quitar.`
                              );

                            warns.warns -= 1;
                            warns.save();
                            purchase.remove();

                            let embed = new Discord.MessageEmbed()
                              .setAuthor(`| Listo`, guild.iconURL())
                              .setColor(Colores.verde).setDescription(`
\`▸\` ${item.replyMessage}
\`▸\` Ahora tienes: **${warns.warns}** warns.`);

                            return message.channel.send(embed);
                          } else {
                            warns.warns += 1;
                            warns.save();
                            purchase.remove();

                            let embed = new Discord.MessageEmbed()
                              .setAuthor(`| Listo`, guild.iconURL())
                              .setColor(Colores.verde).setDescription(`
\`▸\` ${item.replyMessage}
\`▸\` Ahora tienes: **${warns.warns}** warn(s).`);

                            return message.channel.send(embed);
                          }
                        }
                      );
                    } else if (thing === "role") {
                      if (use.thingID === "na") return message.channel.send(`Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas __usar__ tu item :)`);

                      if (action === "delete") {
                        let r = guild.roles.cache.find(x => x.id === use.thingID);

                        if (!message.member.roles.cache.find(x => x.id === r.id)) return message.reply(`no tienes el rol que se quita al usar \`${item.itemName}\`.`);

                        message.member.roles.remove(r).then(() => {
                          purchase.remove();
                          let embed = new Discord.MessageEmbed()
                            .setAuthor(`| Listo`, guild.iconURL())
                            .setColor(Colores.verde).setDescription(`
\`▸\` ${item.replyMessage}.`);

                          return message.channel.send(embed);
                        });
                      } else {
                        let r = guild.roles.cache.find(x => x.id === use.thingID);
                        let jeffrosPrice = item.itemPrice;
                        let subscriptionName = item.itemName;

                        let isSub = use.isSub ? true : false;

                        if (message.member.roles.cache.find(x => x.id === r.id)) return message.reply(`ya tienes el rol que se da al usar \`${item.itemName}\`.`);

                        if(duration === "na" || duration === "permanent"){

                          message.member.roles.add(r).then(() => {
                            purchase.remove();
                            let embed = new Discord.MessageEmbed()
                              .setAuthor(`| Listo`, guild.iconURL())
                              .setColor(Colores.verde)
                              .setDescription(`\`▸\` ${item.replyMessage}.`);

                            return message.channel.send(embed);
                          });
                        } else {
                          if(!isSub){ // no es una sub pero tiene tiempo limitado
                            return LimitedTime(r.id, message.member, duration, use.special.type, use.special.specialObjective, use.special.specialValue);
                          } else {
                            return Subscription(r.id, message.member, duration, true, jeffrosPrice, subscriptionName).then(() => {
                              purchase.remove();
                              let embed = new Discord.MessageEmbed()
                                .setAuthor(`| Listo`, guild.iconURL())
                                .setColor(Colores.verde)
                                .setDescription(`\`▸\` ${item.replyMessage}.`)
                                .setFooter(`Para cancelar la suscripción usa ${prefix}usar cancel <${args[0]}>`);

                              message.channel.send(embed);
                            });
                          }
                        }
                      }
                    } else {
                      return message.channel.send(
                        `Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas __usar__ tu item :)`
                      );
                    }
                    
                  }
                );
              }
              
            );
      });
    })

  }

  function LimitedTime(roleID, victimMember, duration, specialType, specialObjective, specialValue){
    let role = guild.roles.cache.find(x => x.id === roleID);
    let specialType = specialType || false;
    let specialObjective = specialObjective || false;
    let specialValue = specialValue || false;
    let hoy = new Date();

    const newData = new GlobalData({
      info: {
        type: "limitedTimeRole":
        roleID: roleID,
        userID: victimMember,
        since: hoy,
        duration: ms(duration),
        special: {
          "type": specialType, // boostMultiplier
          "specialObjective": specialObjective, // exp, jeffros, all
          "specialValue": specialValue // (2) = exp || jeffros normales x 2
        }
      }
    })

    newDate.save();
  }
  function Subscription(roleID, victimMember, intervalTime, isInfinite, jeffrosPerInterval, subscriptionName){
    let role = guild.roles.cache.find(x => x.id === roleID);

    if(intervalTime != "permanent" || intervalTime === "na"){
      // no es una sub
      return;
    } else {
      let hoy = new Date();

      const newData = new GlobalData({
        info: {
          type: "jeffrosSubscription",
          roleID: roleID,
          userID: victimMember.id,
          since: hoy,
          interval: ms(intervalTime),
          isInfinite: isInfinite,
          price: jeffrosPerInterval,
          subName: subscriptionName
        }
      })

      newDate.save();
    }
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
};

module.exports.help = {
  name: "usar",
  alias: "use"
};
