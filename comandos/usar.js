const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const ms = require("ms");
const functions = require("./../resources/functions.js");

/* ##### MONGOOSE ######## */

const Warn = require("../modelos/warn.js");

const Items = require("../modelos/items.js");
const Purchased = require("../modelos/purchased.js");
const All = require("../modelos/allpurchases.js");
const Use = require("../modelos/use.js");
const Ignore = require("../modelos/ignore.js")
const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let item;

  if(client.user.id === Config.testingJBID){
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

          let correctUseAdd = new Discord.MessageEmbed()
          .setAuthor(`| Error`, Config.errorPng)
          .setDescription(`▸ El uso correcto es: /use add <id> <add || delete> <jeffros | warns | role> (id de role) ($duracion) (es un pago cada cierta $duracion "true" ; "false") (specialType "boostMultiplier") (specialObjetive "exp, jeffros, all") (specialValue [MULTIPLICADOR] "2" = Jeffros ganados normalmente * 2)`)
          .setColor(Colores.rojo);

          if (!args[1]) return message.channel.send(correctUseAdd);
          if (!args[2]) return message.channel.send(correctUseAdd);
          if (!args[3]) return message.channel.send(correctUseAdd);

          let cosaID = "na";
          if (args[3].toLowerCase() === "role" && !args[4] || args[3].toLowerCase() === "role" && isNaN(args[4])) {
            return message.channel.send(correctUseAdd)
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
            suscription = args[6] == "true" ? true : false;
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
    let subToCancel = !isNaN(args[1]) ? args[1] : false;

    if(!subToCancel) return message.reply("lo siento, no encontré esa ID...");

    let queryItem = await Use.findOne({
      itemID: subToCancel,
      isSub: true
    });

    if(!queryItem) return message.reply("lo siento, no encontré que ese item en la tienda sea de tipo suscripción...");

    GlobalData.findOne({
      "info.type": "jeffrosSubscription",
      "info.userID": author.id,
      "info.roleID": queryItem.thingID,
      "info.isCancelled": false
    }, (err, subbed) => {

      if(!subbed) return message.reply("lo siento, no encontré una suscripción activa en tu cuenta.");


      // INICIAR PROCESO DE CONFIRMACION

      let cancelConfirmation = new Discord.MessageEmbed()
      .setAuthor(`| Cancelar?`, guild.iconURL())
      .setColor(Colores.rojo)
      .setDescription(`\`▸\` ¿Estás seguro de cancelar tu suscripción a \`${subbed.info.subName}\`?
\`▸\` Mantendrás tus beneficios hasta que se acabe el tiempo de suscripción.
\`▸\` Reacciona de acuerdo a tu preferencia.`)
      .setFooter(
        `▸ No podrás usar ${subbed.info.subName} hasta que se acabe el mes de suscripción actual.`,
        "https://cdn.discordapp.com/emojis/494267320097570837.png"
      );

      message.channel.send(cancelConfirmation).then(msg => {
        msg.react(":allow:558084462232076312")
        .then(r => {
          msg.react(":denegar:558084461686947891");
        });

        let cancelEmbed = new Discord.MessageEmbed()
        .setDescription(`Cancelado.`)
        .setColor(Colores.nocolor);

        const yesFilter = (reaction, user) => reaction.emoji.id === "558084462232076312" && user.id === message.author.id;
        const noFilter = (reaction, user) =>  reaction.emoji.id === "558084461686947891" && user.id === message.author.id;
        const collectorFilter = (reaction, user) => ['558084462232076312', '558084461686947891'].includes(reaction.emoji.id) && user.id === message.author.id;

        const yes = msg.createReactionCollector(yesFilter, { time: ms("30s") });
        const no = msg.createReactionCollector(noFilter, { time: ms("30s") });
        const collector = msg.createReactionCollector(collectorFilter, { time: ms("30s") });

        collector.on("end", (r) => {
          if(r.size > 0) return;
          return msg.edit(cancelEmbed).then(a => {
            msg.reactions.removeAll().then(() => {
              msg.react("795090708478033950");
            });
            message.delete();
            a.delete({timeout: ms("20s")});
          });
        });

        yes.on("collect", r => {
          subbed.info.isCancelled = true;
          subbed.markModified("info");
          subbed.save();

          let cancelledEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Listo`, Config.bienPng)
          .setDescription(`**—** Se ha cancelado tu suscripción a \`${subbed.info.subName}\`.
          **—** Puedes comprar \`${subbed.info.subName}\`, pero sólo lo podrás usar hasta que se acabe tu suscripción actual.`)
          .setColor(Colores.verde);

          return msg.edit(cancelledEmbed).then(() => {
            msg.reactions.removeAll();
            collector.stop();
          });
        });

        no.on("collect", r => {
          return msg.edit(cancelEmbed).then(a => {
            collector.stop();
            msg.reactions.removeAll();
            message.delete();
            a.delete({timeout: ms("20s")});
          });
        })

      })
      

    });





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
                  async (err, all) => {
                    
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
                      if (use.thingID === "na") return message.channel.send(`[001] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas __usar__ tu item :)`);

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

                        let ignoreIf = { // ignorar los itmes con id X si la id del item Y
                          "3": [
                            "6"
                          ],
                          "4": [
                            "6"
                          ],
                          "6": [
                            "3",
                            "4"
                          ]
                        }

                        let willBenefit = await forWait(ignoreIf, use);

                        console.log("AFTER FOR")
                        console.log(willBenefit);

                        if (message.member.roles.cache.find(x => x.id === r.id)) return message.reply(`ya tienes el rol que se da al usar \`${item.itemName}\`.`);
                        if (willBenefit === true) return message.reply(`lo siento, pero si usas este item, te estarías beneficiandote aún más, espera a que tu Boost actual termine para poder usar \`${item.itemName}\`.`)
                        return message.channel.send("se beneficiaría? ("+willBenefit+")");

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
                            functions.LimitedTime(guild, r.id, message.member, duration, use.special.type, use.special.specialObjective, use.special.specialValue);
                            
                            purchase.remove();
                            let embed = new Discord.MessageEmbed()
                              .setAuthor(`| Listo`, guild.iconURL())
                              .setColor(Colores.verde)
                              .setDescription(`\`▸\` ${item.replyMessage}.`);

                            return message.channel.send(embed);
                          } else {
                            functions.Subscription(guild, r.id, message.member, duration, jeffrosPrice, subscriptionName);

                            purchase.remove();
                            let embed = new Discord.MessageEmbed()
                              .setAuthor(`| Listo`, guild.iconURL())
                              .setColor(Colores.verde)
                              .setDescription(`\`▸\` ${item.replyMessage}.`)
                              .setFooter(`Para cancelar la suscripción usa ${prefix}usar cancel <${args[0]}>`);

                            return message.channel.send(embed);
                          }
                        }
                      }
                    } else {
                      return message.channel.send(
                        `[002] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas __usar__ tu item :)`
                      );
                    }
                    
                  }
                );
              }
              
            );
      });
    })
  }

  async function forWait(obj, act) {
    let response = false;

    for (let ignoredID in obj){
      if(act.itemID === ignoredID){
        // buscar si el usuario tiene algun rol de los items dentro de este ignoredID
        for(let i = 0; i < obj[ignoredID].length; i++){
          console.log(obj[ignoredID][i]);
          Use.findOne({
            itemID: obj[ignoredID][i]
          }, (err, u) => {
            if(message.member.roles.cache.find(x => x.id === u.thingID)) {
              console.log("el miembro tiene el rol", u.thingID)
              response = true;
            } else {
              console.log("el miembro NO tiene el rol", u.thingID)
            }
          });
        }
      }
    }

    console.log("#######",response)
    return response;
  }
};

module.exports.help = {
  name: "usar",
  alias: "use"
};
