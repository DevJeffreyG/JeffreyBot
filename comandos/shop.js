const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");
const prefix = Config.prefix;
const prettyms = require("pretty-ms");

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");

const Items = require("../modelos/items.js");
const Purchased = require("../modelos/purchased.js");
const All = require("../modelos/allpurchases.js");
const Use = require("../modelos/use.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  
  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let item;
  //let interest = 2000; // CUANTO SUBE EL PRECIO POR COMPRA

  let userIsOnMobible = author.presence.clientStatus && author.presence.clientStatus.mobile === "online" && !author.presence.clientStatus.desktop ? true : false;
  let viewExtension = "ꜝ";
  let extendedDetails = "▸ Al comprar este item, su precio subirá."

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  const itemPerPage = 3;

  if (!args[0]) {
    // primero se buscan TODOS los items que hayan en la tienda
    Items.find({
        serverID: guild.id
    },(err, items) => {
        if (err) throw err;

        Jeffros.findOne({
          serverID: guild.id,
          userID: author.id
        }, async (err, j) => { // buscar las jeffros del quien hace el comando "j"


        let embed = new Discord.MessageEmbed()
        .setAuthor(`| Shop`,author.displayAvatarURL())
        .setDescription(`**—** ¡Bienvenid@ a la tienda! para comprar items usa \`${prefix}shop <ID del item>\`.
**—** Para tener más información del item usa \`${prefix}shop info <id>\`.
**—** Tienes ${Emojis.Jeffros}**${j.jeffros}**`);

        if (items.length === 0) { // si no hay items en la db
          embed.setColor(Colores.rojo);
          embed.addField(
            `— No hay nada`,
            `¡La tienda aún no tiene items, vuelve más tarde!`
          );
          return message.channel.send(embed);
        } else {
          // si hay menos de 3 resultados
          if (items.length <= itemPerPage) {
            let interest = items[i].interest;
            embed.setColor(Colores.verde);
            embed.setFooter(`| Tienda oficial - Página 1 de 1`, guild.iconURL());

            for (let i = 0; i < items.length; i++) {
              let isSub = false;
              let time = null;
              let usesQuery = await Use.findOne({
                serverID: guild.id,
                itemID: items[i].id
              }, (err, actualItemUse) => {
                if(!actualItemUse) return null;
                isSub = actualItemUse.isSub;

                time = isSub ? prettyms(Number(actualItemUse.duration), {secondsDecimalDigits: 0 }) : null;
              });

              if(!usesQuery) return message.channel.send(`[003] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas seguir usando correctamente el comando :)`)

              All.findOne({
                  userID: author.id,
                  itemID: items[i].id,
                  isDarkShop: false
              }, (err, all) => { //totalpurchases
                  let precio = items[i].itemPrice;

                  if (all) { // si un usuario tiene totalpurchases del item del loop actual
                    precio = Math.floor(precio) + all.quantity * interest;

                    if (message.member.roles.cache.find(x => x.id === Config.lvl20)) {
                      precio = `~~${precio}~~ ${precio - ((precio) / 100) * 15}`;
                    }
                  } else {
                    if (message.member.roles.cache.find(x => x.id === Config.lvl20)) { // si tiene descuentos de lvl 20
                      precio = `~~${precio}~~ ${Math.floor(precio) - (Math.floor(precio) / 100) * 15}`;
                    }
                  }

                  if(!isSub){
                    if(userIsOnMobible && interest){ // esta movil, y hay interes
                      embed.addField(
                        `— { ${items[i].id} } ${items[i].itemName}`,
                        `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}\n\`▸\` ${extendedDetails.slice(2, extendedDetails.length)} (+${interest}).`
                      );
                    } else if(!userIsOnMobible && interest){ // no está en movil, y tambien hay interes
                      embed.addField(
                        `— { ${items[i].id} } ${items[i].itemName}`,
                        `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio} [${viewExtension}](${message.url} '${extendedDetails} (+${interest})')`
                      );
                    } else { // puede estar o no en movil, pero no hay interes
                      embed.addField(
                        `— { ${items[i].id} } ${items[i].itemName}`,
                        `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}`
                      );
                    }
                  } else { // es una suscripción
                    embed.addField(
                        `— { ${items[i].id} } ${items[i].itemName}`,
                        `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio} **/${time}**`
                    );
                  }

                  if (i + 1 === items.length) {
                    return message.channel.send(embed);
                  }
                }
              );
            }
          } else { // hay más de 3 resultados
            let pagn = "1";
            let totalpags;

            Items.countDocuments({}, async (err, c) => {
              if (err) throw err;

              totalpags = Math.ceil(c / itemPerPage);

              let inicio = itemPerPage * pagn - itemPerPage;
              let fin = itemPerPage * pagn - 1;

              if (items.length <= fin) {
                fin = items.length - 1;
              }

              embed.setFooter(
                `| Tienda oficial - Página 1 de ${totalpags}`,
                guild.iconURL()
              );

              embed.setColor(Colores.verde);

              // hacer la primera página
              for (let i = 0; i <= fin; i++) {
                let interest = items[i].interest;
                let isSub = false;
                let time = null;
                let usesQuery = await Use.findOne({
                  serverID: guild.id,
                  itemID: items[i].id
                }, (err, actualItemUse) => {
                  if(!actualItemUse) return null;
                  isSub = actualItemUse.isSub;

                  time = isSub ? prettyms(Number(actualItemUse.duration), {secondsDecimalDigits: 0 }) : null;
                });

                if(!usesQuery) return message.channel.send(`[004] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas seguir usando correctamente el comando :)`)

                let all = await All.findOne({
                    userID: author.id,
                    itemID: items[i].id,
                    isDarkShop: false
                }, (err, all) => {
                    if(err) throw err;
                });

                let precio = all ? Math.floor(items[i].itemPrice) + all.quantity * interest : items[i].itemPrice;

                if (message.member.roles.cache.find(x => x.id === Config.lvl20) && all) {
                  precio = `~~${precio}~~ ${precio - ((precio) / 100) * 15}`;
                } else if(message.member.roles.cache.find(x => x.id === Config.lvl20)){
                  precio = `~~${precio}~~ ${precio - ((Math.floor(precio)) / 100) * 15}`;
                }

                if(!isSub){ // si no es una suscripción
                  if(userIsOnMobible && interest){ // esta movil, y hay interes
                    embed.addField(
                      `— { ${items[i].id} } ${items[i].itemName}`,
                      `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}\n\`▸\` ${extendedDetails.slice(2, extendedDetails.length)} (+${interest}).`
                    );
                  } else if(!userIsOnMobible && interest){ // no está en movil, y tambien hay interes
                    embed.addField(
                      `— { ${items[i].id} } ${items[i].itemName}`,
                      `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio} [${viewExtension}](${message.url} '${extendedDetails} (+${interest})')`
                    );
                  } else { // puede estar o no en movil, pero no hay interes
                    embed.addField(
                      `— { ${items[i].id} } ${items[i].itemName}`,
                      `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}`
                    );
                  }
                } else { // es una suscripción
                  embed.addField(
                      `— { ${items[i].id} } ${items[i].itemName}`,
                      `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio} **/${time}**`
                  );
                } 
              }

              message.channel.send(embed).then(msg => {
                  msg.react("⏪").then(r => {
                    msg.react("⏩");

                    const backwardsFilter = (reaction, user) => reaction.emoji.name === "⏪" && user.id === message.author.id;
                    const forwardsFilter = (reaction, user) =>reaction.emoji.name === "⏩" && user.id === message.author.id;
                    const collectorFilterMainPage = (reaction, user) => (reaction.emoji.name === "⏩" || reaction.emoji.name === "⏪") && user.id === message.author.id;

                    const backwards = msg.createReactionCollector(backwardsFilter, {time: 60000});
                    const forwards = msg.createReactionCollector(forwardsFilter,{ time: 60000});
                    const collectorMainPage = msg.createReactionCollector(collectorFilterMainPage,{time: 60000});

                    collectorMainPage.on("end", r => {
                      return msg.reactions.removeAll()
                      .then(() => {
                          msg.react("795090708478033950");
                      });
                    })

                    backwards.on("collect", async(r, user) => {
                      let reactions = r.message.reactions.cache.find(x => x.emoji.name === "⏪");

                      if (pagn === 1) return reactions.users.remove(user.id);;
                      pagn--;

                      embed = new Discord.MessageEmbed()
                        .setAuthor(`| Shop`, author.displayAvatarURL())
                        .setColor(Colores.verde)
                        .setDescription(`**—** ¡Bienvenido a la nueva tienda! para comprar items \`${prefix}shop <ID del item>\`.
**—** Para tener más información del item usa \`${prefix}shop info <id>\`.
**—** Tienes ${Emojis.Jeffros}**${j.jeffros}**`);

                      Items.countDocuments({}, async (err, c) => {
                        if (err) throw err;

                        totalpags = Math.ceil(c / itemPerPage);

                        let inicio = itemPerPage * pagn - itemPerPage;
                        let fin = itemPerPage * pagn - 1;

                        if (items.length <= fin) {
                          fin = items.length - 1;
                        }

                        embed.setFooter(
                          `| Tienda oficial - Página ${pagn} de ${totalpags}`,
                          guild.iconURL()
                        );
                        
                        for (let i = inicio; i <= fin; i++) {
                          let interest = items[i].interest;
                          let isSub = false;
                          let time = null;
                          let usesQuery = await Use.findOne({
                            serverID: guild.id,
                            itemID: items[i].id
                          }, (err, actualItemUse) => {
                            if (!actualItemUse) return null;
                            isSub = actualItemUse.isSub;

                            time = isSub ? prettyms(Number(actualItemUse.duration), {secondsDecimalDigits: 0 }) : null;
                          });

                          if(!usesQuery) return message.channel.send(`[005] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas seguir usando correctamente el comando :)`)

                          all = await All.findOne({
                              userID: author.id,
                              itemID: items[i].id,
                              isDarkShop: false
                          },(err, all) => {
                              if(err) throw err;
                          });

                          let precio = all ? Math.floor(items[i].itemPrice) + all.quantity * interest : items[i].itemPrice;

                          if(message.member.roles.cache.find(x => x.id === Config.lvl20) && all){
                            precio = `~~${precio}~~ ${precio - ((precio) / 100) * 15}`;
                          } else if(message.member.roles.cache.find(x => x.id === Config.lvl20)){
                            precio = `~~${precio}~~ ${precio - ((Math.floor(precio)) / 100) * 15}`;
                          }
                              
                          if(!isSub){ // no es una sub
                            if(userIsOnMobible && interest){ // esta movil, y hay interes
                              embed.addField(
                                `— { ${items[i].id} } ${items[i].itemName}`,
                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}\n\`▸\` ${extendedDetails.slice(2, extendedDetails.length)} (+${interest}).`
                              );
                            } else if(!userIsOnMobible && interest){ // no está en movil, y tambien hay interes
                              embed.addField(
                                `— { ${items[i].id} } ${items[i].itemName}`,
                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio} [${viewExtension}](${message.url} '${extendedDetails} (+${interest})')`
                              );
                            } else { // puede estar o no en movil, pero no hay interes
                              embed.addField(
                                `— { ${items[i].id} } ${items[i].itemName}`,
                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}`
                              );
                            }
                          } else { // es una suscripción
                            embed.addField(
                                `— { ${items[i].id} } ${items[i].itemName}`,
                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio} **/${time}**`
                            );
                          }
                        }

                        await msg.edit(embed);
                        return reactions.users.remove(user.id);
                      });
                    });

                    forwards.on("collect", async(r, user) => {
                      let reactions = r.message.reactions.cache.find(x => x.emoji.name === "⏩");

                      if (pagn === totalpags) return reactions.users.remove(user.id);;
                      pagn++;

                      embed = new Discord.MessageEmbed()
                        .setAuthor(`| Shop`, author.displayAvatarURL())
                        .setColor(Colores.verde)
                        .setDescription(`**—** ¡Bienvenido a la nueva tienda! para comprar items \`${prefix}shop <ID del item>\`.
**—** Para tener más información del item usa \`${prefix}shop info <id>\`.
**—** Tienes ${Emojis.Jeffros}**${j.jeffros}**`);

                      Items.countDocuments({}, async (err, c) => {
                        if (err) throw err;

                        totalpags = Math.ceil(c / itemPerPage);

                        let inicio = itemPerPage * pagn - itemPerPage;
                        let fin = itemPerPage * pagn - 1;

                        if (items.length <= fin) {
                          fin = items.length - 1;
                        }

                        embed.setFooter(
                          `| Tienda oficial - Página ${pagn} de ${totalpags}`,
                          guild.iconURL()
                        );

                        for (let i = inicio; i <= fin; i++) {
                          let interest = items[i].interest;
                          let isSub = false;
                          let time = null;
                          let usesQuery = await Use.findOne({
                            serverID: guild.id,
                            itemID: items[i].id
                          }, (err, actualItemUse) => {
                            if(err) throw err;
                            if(!actualItemUse) return null;
                            
                            isSub = actualItemUse.isSub;

                            time = isSub ? prettyms(Number(actualItemUse.duration), {secondsDecimalDigits: 0 }) : null;
                          });

                          if(!usesQuery) return message.channel.send(`[001] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas seguir usando correctamente el comando :)`)

                          all = await All.findOne({
                              userID: author.id,
                              itemID: items[i].id,
                              isDarkShop: false
                          }, (err, all) => {
                              if (err) throw err;
                          });

                          let precio = all ? Math.floor(items[i].itemPrice) + all.quantity * interest : items[i].itemPrice;

                          if (message.member.roles.cache.find(x => x.id === Config.lvl20) && all) {
                            precio = `~~${precio}~~ ${precio - ((precio) / 100) * 15}`;
                          } else if(message.member.roles.cache.find(x => x.id === Config.lvl20)){
                            precio = `~~${precio}~~ ${precio - ((Math.floor(precio)) / 100) * 15}`;
                          }
                              
                          if(!isSub){
                            if(userIsOnMobible && interest){ // esta movil, y hay interes
                              embed.addField(
                                `— { ${items[i].id} } ${items[i].itemName}`,
                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}\n\`▸\` ${extendedDetails.slice(2, extendedDetails.length)} (+${interest}).`
                              );
                            } else if(!userIsOnMobible && interest){ // no está en movil, y tambien hay interes
                              embed.addField(
                                `— { ${items[i].id} } ${items[i].itemName}`,
                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio} [${viewExtension}](${message.url} '${extendedDetails} (+${interest})')`
                              );
                            } else { // puede estar o no en movil, pero no hay interes
                              embed.addField(
                                `— { ${items[i].id} } ${items[i].itemName}`,
                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}`
                              );
                            }
                          } else { // es una suscripción
                            embed.addField(
                                `— { ${items[i].id} } ${items[i].itemName}`,
                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio} **/${time}**`
                            );
                          }
                        }

                        await msg.edit(embed);
                        return reactions.users.remove(user.id);
                      });
                    });
                  });
                });
            });
          }
        }
      })
      }
    );
  } else {
    let action = args[0].toLowerCase();

    if (!isNaN(action)) {
      // ################################################################################## COMPRAR ITEM ########################################################################################
      Jeffros.findOne({
        serverID: guild.id,
        userID: author.id
      }, (err, currency) => {
          if (err) throw err;

          if (!currency) {
            let error1 = new Discord.MessageEmbed()
              .setAuthor(`| Error`, Config.errorPng)
              .setDescription(
                `**—** No tienes ${Emojis.Jeffros}effros, habla en <#${Config.mainChannel}> para ganarlos.`
              )
              .setColor(Colores.rojo);

              message.channel.send(error1);
          } else {
            Items.findOne({
              serverID: guild.id,
              id: action
            }, async (err, item) => {
                if (err) throw err;

                if (!item) {
                  return message.reply(`ese item no existe.`);
                } else {
                  //embeds

                  // descuentos

                  all = await All.findOne({
                    userID: author.id,
                    itemID: action,
                    isDarkShop: false
                  }, (err, all) => {
                    if(err) throw err; 
                  });

                  let precio = all ? Math.floor(item.itemPrice) + all.quantity * interest : Math.floor(item.priceItem)

                  if (message.member.roles.cache.find(x => x.id === Config.lvl20)) {
                    precio = (precio) - ((precio) / 100) * 15;
                  }

                  let doesntHaveRole = new Discord.MessageEmbed()
                    .setAuthor(`| Error`, Config.errorPng)
                    .setDescription(`**—** Necesitas el role "<@&${item.roleRequired}>" para comprar \`${item.itemName}\`.`)
                    .setColor(Colores.rojo);

                  let doesntHaveEnough = new Discord.MessageEmbed()
                    .setAuthor(`| Error`, Config.errorPng)
                    .setDescription(`**—** Necesitas **${Emojis.Jeffros}${precio}** para comprar \`${item.itemName}\`. Tienes **${Emojis.Jeffros}${currency.jeffros}**.`)
                    .setColor(Colores.rojo);

                  let hasRoleToGive = new Discord.MessageEmbed()
                    .setAuthor(`| Error`, Config.errorPng)
                    .setDescription(`**—** Ya tienes el role que te da este item, no puedes comprar \`${item.itemName}\` otra vez.`)
                    .setColor(Colores.rojo);

                  let hasThisItem = new Discord.MessageEmbed()
                    .setAuthor(`| Error`, Config.errorPng)
                    .setDescription(`**—** Ya tienes \`${item.itemName}\`, úsalo con \`${prefix}usar ${item.id}\`.`)
                    .setColor(Colores.rojo);

                  if (item.roleRequired != "na" && !message.member.roles.cache.find(x => x.id === item.roleRequired)) return message.channel.send(doesntHaveRole); // si no tiene el role requerido

                  Use.findOne({
                    serverID: guild.id,
                    itemID: item.id
                  },(err, use) => {
                      if (err) throw err;

                      if (!use) {
                        return message.channel.send(
                          `[002] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas comprar tu item :)`
                        );
                      }

                      if (use.thingID != "na" && use.thing === "role" && message.member.roles.cache.find(x => x.id === use.thingID)) return message.channel.send(hasRoleToGive); // tiene el rol que da el item

                      if (currency.jeffros < precio) return message.channel.send(doesntHaveEnough); // revisando que tenga el dinero para pagar

                      Purchased.findOne({
                        userID: author.id,
                        itemID: item.id
                      }, (err, purchase) => {
                          if (err) throw err;

                          if (!purchase) {
                            // CONFIRMACION DE COMPRA
                            let buyEmbed = new Discord.MessageEmbed()
                              .setAuthor(`| Compra`, guild.iconURL())
                              .setColor(Colores.rojo)
                              .setDescription(
                                `
\`▸\` ¿Estás seguro de comprar \`${item.itemName}\` por **${Emojis.Jeffros}${precio}**?
\`▸\` Reacciona de acuerdo a tu preferencia.`
                              )
                              .setFooter(
                                `▸ Esta compra no se puede devolver.`,
                                "https://cdn.discordapp.com/emojis/494267320097570837.png"
                              );

                            message.channel.send(buyEmbed).then(msg => {
                              msg.react(":allow:558084462232076312")
                                .then(r => {
                                  msg.react(":denegar:558084461686947891");
                                });

                              let cancelEmbed = new Discord.MessageEmbed()
                                .setDescription(`Cancelado.`)
                                .setColor(Colores.nocolor);

                              const yesFilter = (reaction, user) => reaction.emoji.id === "558084462232076312" && user.id === message.author.id;
                              const noFilter = (reaction, user) =>  reaction.emoji.id === "558084461686947891" && user.id === message.author.id;
                              const collectorFilter = (reaction, user) => (reaction.emoji.id === "558084462232076312" || reaction.emoji.id === "558084461686947891") && user.id === message.author.id;

                              const yes = msg.createReactionCollector(yesFilter, { time: ms("30s") });
                              const no = msg.createReactionCollector(noFilter, { time: ms("30s") });
                              const collector = msg.createReactionCollector(collectorFilter, { time: ms("30s") });

                              collector.on("collect", r => {
                                collector.stop();
                              })

                              collector.on("end", (r) => {
                                if(r.size > 0 && (r.size === 1 && !r.first().me)) return;
                                return msg.edit(cancelEmbed).then(a => {
                                  msg.reactions.removeAll().then(() => {
                                    msg.react("795090708478033950");
                                  });
                                  message.delete();
                                  a.delete({timeout: ms("20s")});
                                });
                              });

                              yes.on("collect", r => {
                                currency.jeffros -= precio;

                                const newPurchase = new Purchased({
                                  userID: author.id,
                                  itemID: item.id
                                });

                                currency.save();
                                newPurchase.save();
                                let useEmbed = new Discord.MessageEmbed()
                                  .setAuthor(`| Listo!`, guild.iconURL())
                                  .setDescription(
                                    `
\`▸\` Pago realizado con éxito.
\`▸\` Compraste: \`${item.itemName}\` por **${Emojis.Jeffros}${precio}**.
\`▸ Úsalo con '${prefix}usar ${item.id}'\`.
\`▸\` Ahora tienes: **${Emojis.Jeffros}${currency.jeffros}**.`
                                  )
                                  .setColor(Colores.verde);

                                return msg.edit(useEmbed).then(() => {
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
                          } else {
                            // si ya tiene el item, pero no lo ha activado
                            return message.channel.send(hasThisItem);
                          }
                        }
                      );
                    }
                  );
                }
              }
            );
          }
        }
      );
    } else if (action === "add") {
      if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
      let plus = 1;
      Items.countDocuments({}, (err, c) => {
        Items.findOne(
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

            Items.findOne(
              {
                serverID: guild.id
              },
              (err, data) => {
                if (err) throw err;

                // /shop add nombre precio rolerequerido
                // /shop  0    1      2         3

                let errorEmbed = new Discord.MessageEmbed()
                  .setAuthor(`| Error`, Config.errorPng)
                  .setDescription(
                    `▸ El uso correcto es: /shop add <nombre> <precio> <precio de subida por compra (0 para que no suba)> (@role requerido o ID)
**—** Para los roles, si no se necesita, rellenar con "\`na\`".`
                  )
                  .setColor(Colores.nocolor);

                if (!args[1]) return message.channel.send(errorEmbed);
                if (!args[2]) return message.channel.send(errorEmbed);
                if (!args[3] ||(args[3] && isNaN(args[3]))) return message.channel.send(errorEmbed);
                if (!args[4]) return message.channel.send(errorEmbed);

                let nameItem = args[1];
                let priceItem = args[2];
                let newInterest = Number(args[3]);
                let reqRole = args[4] ? args[4] : "na";

                let lastID = c + plus;

                const newItem = new Items({
                  serverID: guild.id,
                  itemName: nameItem,
                  itemPrice: priceItem,
                  itemDescription: "na",
                  replyMessage: "¡Item usado con éxito!",
                  roleRequired: reqRole,
                  interest: newInterest,
                  id: lastID
                });

                newItem.save();
                let goodEmbed = new Discord.MessageEmbed()
                  .setAuthor(`| Listo`, Config.bienPng)
                  .setDescription(
                    `**—** Para personalizar la información del item usa \`${prefix}shop edit <id> <nombre, precio, etc...> <nuevo>\`.

**—** Nombre: \`${nameItem}\`.
**—** Precio: ${Emojis.Jeffros}${priceItem}.
**—** Descripción: \`na\`.
**—** Mensaje después de comprar: \`¡Item usado con éxito!\`.
**—** Role requerido: \`${reqRole}\`.
**—** Interés por compra: **${Emojis.Jeffros}${newInterest}**.
**—** ID: \`${lastID}\`.`
                  )
                  .setColor(Colores.verde);
                return message.channel.send(goodEmbed);
              }
            );
          }
        );
      });
    } else if (action === "remove") {
      if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
      // /shop remove id
      // /shop    0    1

      let errorEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Error`, Config.errorPng)
        .setDescription(`▸ El uso correcto es: /shop remove <id del item>`)
        .setColor(Colores.nocolor);

      if (!args[1]) return message.channel.send(errorEmbed);

      Items.findOneAndDelete(
        {
          serverID: guild.id,
          id: args[1]
        },
        (err, data) => {
          if (err) throw err;

          if (!data) {
            return message.reply(`no he encontrado ese item con ese id.`);
          } else {
            return message.reply(`se ha eliminado!`);
          }
        }
      );
    } else if (action === "info") {
      let errorEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Error`, Config.errorPng)
        .setDescription(`▸ El uso correcto es: /shop info <id del item>`);

      if (!args[1]) return message.channel.send(errorEmbed);

      Items.findOne(
        {
          serverID: guild.id,
          id: args[1]
        },
        (err, data) => {
          if (err) throw err;

          if (!data) {
            return message.reply(`no he encontrado ese item, revisa la id.`);
          } else {
            let reqrole = guild.roles.cache.find(
              x => x.id === data.roleRequired
            );

            if (!reqrole) {
              reqrole = "Ninguno";
            }

            let embed = new Discord.MessageEmbed()
              .setAuthor(`| Item ${data.id}`, guild.iconURL())
              .setDescription(
                `**—** Si quieres cambiar algo usa el comando \`${prefix}shop edit <id> <nombre, precio, etc> <nuevo>\`.

**—** Nombre: \`${data.itemName}\`.
**—** Precio: ${Emojis.Jeffros}${data.itemPrice}.
**—** Descripción: \`${data.itemDescription}\`.
**—** Mensaje respuesta (lo que se envía después de comprar): \`${data.replyMessage}\`.
**—** Role requerido: \`${reqrole}\`.
**—** ID: \`${data.id}\`.`
              )
              .setColor(Colores.verde);

            return message.channel.send(embed);
          }
        }
      );
    } else if (action === "edit") {
      if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
      let errorEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Error`, Config.errorPng)
        .setDescription(
          `▸ El uso correcto es: /shop edit <id> <nombre, precio, etc> <nuevo>`
        );

      if (!args[1]) return message.channel.send(errorEmbed);
      if (!args[2]) return message.channel.send(errorEmbed);
      if (!args[3]) return message.channel.send(errorEmbed);

      let idItem = args[1];
      let toEdit = args[2].toLowerCase();
      let newData;

      Items.findOne(
        {
          serverID: guild.id,
          id: idItem
        },
        (err, data) => {
          if (err) throw err;

          if (!data) {
            return message.reply(`no he encontrado este item.`);
          } else {
            let embed = new Discord.MessageEmbed()
              .setAuthor(`| Listo`, Config.bienPng)
              .setColor(Colores.verde);

            switch (toEdit) {
              case "name":
              case "nombre":
                newData = args
                  .join(" ")
                  .slice(args[0].length + args[1].length + args[2].length + 3);
                data.itemName = newData;
                embed.setDescription(
                  `**—** Nombre: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                );
                break;

              case "price":
              case "precio":
              case "jeffros":
                newData = args[3];
                data.itemPrice = newData;
                embed.setDescription(
                  `**—** Precio: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                );
                break;

              case "description":
              case "descripcion":
              case "desc":
                newData = args
                  .join(" ")
                  .slice(args[0].length + args[1].length + args[2].length + 3);
                data.itemDescription = newData;
                embed.setDescription(
                  `**—** Descripción: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                );
                break;

              case "reply":
              case "respuesta":
              case "resp":
                newData = args
                  .join(" ")
                  .slice(args[0].length + args[1].length + args[2].length + 3);
                data.replyMessage = newData;
                embed.setDescription(
                  `**—** Mensaje respuesta: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                );
                break;

              case "req":
              case "requerido":
              case "rolerequerido":
              case "reqrole":
              case "reqrol":
              case "rolereq":
              case "rolreq":
                newData =
                  message.mentions.roles.first() ||
                  guild.roles.cache.get(args[3]);
                data.roleRequired = newData;
                embed.setDescription(
                  `**—** Rol requerido: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                );
                break;

              case "given":
              case "dado":
              case "roledado":
              case "giverole":
              case "givenrol":
              case "rolegiven":
                newData =
                  message.mentions.roles.first() ||
                  guild.roles.cache.get(args[3]);
                data.roleGiven = newData;
                embed.setDescription(
                  `**—** Rol a dar: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                );
                break;

              case "removed":
              case "remove":
              case "quitado":
              case "removedrole":
              case "rem":
              case "del":
              case "delete":
                newData =
                  message.mentions.roles.first() ||
                  guild.roles.cache.get(args[3]);
                data.roleRemoved = newData;
                embed.setDescription(
                  `**—** Rol a quitar: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                );
                break;

              default:
                return message.reply(
                  `\`${toEdit}\` no es una forma válida de editar los items.`
                );
            }

            data.save();
            return message.channel.send(embed);
          }
        }
      );
    }
  }
};

module.exports.help = {
  name: "shop",
  alias: "tienda"
};
