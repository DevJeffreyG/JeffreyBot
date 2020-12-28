const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const ms = require("ms");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");

const Items = require("../modelos/items.js");
const Purchased = require("../modelos/purchased.js");
const All = require("../modelos/allpurchases.js");
const Use = require("../modelos/use.js");
const Ignore = require("../modelos/ignore.js")

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  
  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let item;
  let interest = 2000; // CUANTO SUBE EL PRECIO POR COMPRA

  if(bot.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  let itemPerPage = 3;

  if (!args[0]) {
    // primero se buscan TODOS los items que hayan en la tienda
    Items.find(
      {
        serverID: guild.id
      },
      (err, items) => {
        if (err) throw err;

        Jeffros.findOne({
          userID: author.id
        }, (err, j) => {


        let embed = new Discord.MessageEmbed()
        .setAuthor(
          `| Shop`,
          author.displayAvatarURL()
        )
          .setDescription(`**—** ¡Bienvenido a la nueva tienda! para comprar items \`${prefix}shop <ID del item>\`.
**—** Para tener más información del item usa \`${prefix}shop info <id>\`.
**—** Tienes ${Emojis.Jeffros}**${j.jeffros}**`);

        if (items.length === 0) {
          embed.setColor(Colores.rojo);
          embed.addField(
            `— No hay nada`,
            `¡La tienda aún no tiene items, vuelve más tarde!`
          );
          return message.channel.send(embed);
        } else {
          // si hay menos de o 5 resultados
          if (items.length <= itemPerPage) {
            embed.setColor(Colores.verde);
            embed.setFooter(
              `| Tienda oficial - Página 1 de 1`,
              guild.iconURL()
            );

            for (let i = 0; i < items.length; i++) {
              All.findOne(
                {
                  userID: author.id,
                  itemID: items[i].id,
                  isDarkShop: false
                },
                (err, all) => {
                  let precio = items[i].itemPrice;

                  if (all) {
                    precio =
                      Math.floor(items[i].itemPrice) + all.quantity * interest;

                    if (
                      message.member.roles.cache.find(
                        x => x.id === Config.lvl20
                      )
                    ) {
                      precio = `~~${precio}~~ ${Math.floor(items[i].itemPrice) + all.quantity * interest - ((Math.floor(items[i].itemPrice) + all.quantity * interest) / 100) * 15}`;
                    }
                  } else {
                    if (
                      message.member.roles.cache.find(
                        x => x.id === Config.lvl20
                      )
                    ) {
                      precio = `~~${precio}~~ ${Math.floor(items[i].itemPrice) -
                        (Math.floor(items[i].itemPrice) / 100) * 15}`;
                    }
                  }

                  embed.addField(
                    `— { ${items[i].id} } ${items[i].itemName}`,
                    `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}`
                  );

                  if (i + 1 === items.length) {
                    return message.channel.send(embed);
                  }
                }
              );
            }
          } else {
            let pagn = "1";
            let totalpags;

            Items.countDocuments({}, (err, c) => {
              if (err) throw err;

              totalpags = Math.floor(c / itemPerPage);

              if (!Number.isInteger(c / itemPerPage)) totalpags++;

              let inicio = itemPerPage * pagn - itemPerPage + 1;
              let fin = itemPerPage * pagn;

              inicio = inicio - 1;

              if (items.length < fin - 1) {
                fin = items.length;
              } else if (items.length === fin - 1) {
                fin = items.length - 1;
              } else {
                fin = fin - 1;
              }

              embed.setFooter(
                `| Tienda oficial - Página 1 de ${totalpags}`,
                guild.iconURL()
              );

              embed.setColor(Colores.verde);

              // hacer la primera página
              for (let i = 0; i < itemPerPage; i++) {
                All.findOne(
                  {
                    userID: author.id,
                    itemID: items[i].id,
                    isDarkShop: false
                  },
                  (err, all) => {
                    let precio = items[i].itemPrice;

                    if (all) {
                      precio =
                        Math.floor(items[i].itemPrice) + all.quantity * interest;

                      if (
                        message.member.roles.cache.find(
                          x => x.id === Config.lvl20
                        )
                      ) {
                        precio = `~~${precio}~~ ${Math.floor(
                          items[i].itemPrice
                        ) +
                          all.quantity * interest -
                          ((Math.floor(items[i].itemPrice) +
                            all.quantity * interest) /
                            100) *
                            15}`;
                      }
                    } else {
                      if (
                        message.member.roles.cache.find(
                          x => x.id === Config.lvl20
                        )
                      ) {
                        precio = `~~${precio}~~ ${Math.floor(
                          items[i].itemPrice
                        ) -
                          (Math.floor(items[i].itemPrice) / 100) * 15}`;
                      }
                    }
                    embed.addField(
                      `— { ${items[i].id} } ${items[i].itemName}`,
                      `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}`
                    );

                    if (i + 1 === itemPerPage) {
                      message.channel.send(embed).then(msg => {
                        msg.react("⏪").then(r => {
                          msg.react("⏩");

                          const backwardsFilter = (reaction, user) =>
                            reaction.emoji.name === "⏪" &&
                            user.id === message.author.id;
                          const forwardsFilter = (reaction, user) =>
                            reaction.emoji.name === "⏩" &&
                            user.id === message.author.id;

                          const backwards = msg.createReactionCollector(
                            backwardsFilter,
                            {
                              time: 60000
                            }
                          );
                          const forwards = msg.createReactionCollector(
                            forwardsFilter,
                            {
                              time: 60000
                            }
                          );

                          backwards.on("collect", r => {
                            if (pagn === 1) return;
                            pagn--;

                            embed = new Discord.MessageEmbed()
                              .setAuthor(`| Shop`, author.displayAvatarURL())
                              .setColor(Colores.verde)
                              .setDescription(`**—** ¡Bienvenido a la nueva tienda! para comprar items \`${prefix}shop <ID del item>\`.
**—** Para tener más información del item usa \`${prefix}shop info <id>\`.
**—** Tienes ${Emojis.Jeffros}**${j.jeffros}**`);

                            Items.countDocuments({}, (err, c) => {
                              if (err) throw err;

                              totalpags = Math.floor(c / itemPerPage);

                              if (!Number.isInteger(c / itemPerPage))
                                totalpags++;

                              let inicio = itemPerPage * pagn - itemPerPage + 1;
                              let fin = itemPerPage * pagn;

                              inicio = inicio - 1;
                              console.log(inicio);

                              if (items.length < fin - 1) {
                                fin = items.length;
                              } else if (items.length === fin - 1) {
                                fin = items.length - 1;
                              } else {
                                fin = fin - 1;
                              }

                              embed.setFooter(
                                `| Tienda oficial - Página ${pagn} de ${totalpags}`,
                                guild.iconURL()
                              );
                              for (let i = inicio; i < fin + 1; i++) {
                                All.findOne(
                                  {
                                    userID: author.id,
                                    itemID: items[i].id,
                                    isDarkShop: false
                                  },
                                  (err, all) => {
                                    let precio = items[i].itemPrice;

                                    if (all) {
                                      precio =
                                        Math.floor(items[i].itemPrice) +
                                        all.quantity * interest;

                                      if (
                                        message.member.roles.cache.find(
                                          x => x.id === Config.lvl20
                                        )
                                      ) {
                                        precio = `~~${precio}~~ ${Math.floor(
                                          items[i].itemPrice
                                        ) +
                                          all.quantity * interest -
                                          ((Math.floor(items[i].itemPrice) +
                                            all.quantity * interest) /
                                            100) *
                                            15}`;
                                      }
                                    } else {
                                      if (
                                        message.member.roles.cache.find(
                                          x => x.id === Config.lvl20
                                        )
                                      ) {
                                        precio = `~~${precio}~~ ${Math.floor(
                                          items[i].itemPrice
                                        ) -
                                          (Math.floor(items[i].itemPrice) /
                                            100) *
                                            15}`;
                                      }
                                    }
                                    embed.addField(
                                      `— { ${items[i].id} } ${items[i].itemName}`,
                                      `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}`
                                    );

                                    if (i + 1 === fin + 1) {
                                      return msg.edit(embed);
                                    }
                                  }
                                );
                              }
                            });
                          });

                          forwards.on("collect", r => {
                            if (pagn === totalpags) return;
                            pagn++;

                            embed = new Discord.MessageEmbed()
                              .setAuthor(`| Shop`, author.displayAvatarURL())
                              .setColor(Colores.verde)
                              .setDescription(`**—** ¡Bienvenido a la nueva tienda! para comprar items \`${prefix}shop <ID del item>\`.
**—** Para tener más información del item usa \`${prefix}shop info <id>\`.
**—** Tienes ${Emojis.Jeffros}**${j.jeffros}**`);

                            Items.countDocuments({}, (err, c) => {
                              if (err) throw err;

                              totalpags = Math.floor(c / itemPerPage);

                              if (!Number.isInteger(c / itemPerPage))
                                totalpags++;

                              let inicio = itemPerPage * pagn - itemPerPage + 1;
                              let fin = itemPerPage * pagn;

                              inicio = inicio - 1;

                              if (items.length <= fin - 1) {
                                fin = items.length;
                                }

                              embed.setFooter(
                                `| Tienda oficial - Página ${pagn} de ${totalpags}`,
                                guild.iconURL()
                              );

                              for (let i = inicio; i < fin + 1; i++) {
                                All.findOne(
                                  {
                                    userID: author.id,
                                    itemID: items[i].id,
                                    isDarkShop: false
                                  },
                                  (err, all) => {
                                    let precio = items[i].itemPrice;

                                    if (all) {
                                      precio =
                                        Math.floor(items[i].itemPrice) +
                                        all.quantity * interest;

                                      if (
                                        message.member.roles.cache.find(
                                          x => x.id === Config.lvl20
                                        )
                                      ) {
                                        precio = `~~${precio}~~ ${Math.floor(
                                          items[i].itemPrice
                                        ) +
                                          all.quantity * interest -
                                          ((Math.floor(items[i].itemPrice) +
                                            all.quantity * interest) /
                                            100) *
                                            15}`;
                                      }
                                    } else {
                                      if (
                                        message.member.roles.cache.find(
                                          x => x.id === Config.lvl20
                                        )
                                      ) {
                                        precio = `~~${precio}~~ ${Math.floor(
                                          items[i].itemPrice
                                        ) -
                                          (Math.floor(items[i].itemPrice) /
                                            100) *
                                            15}`;
                                      }
                                    }
                                    embed.addField(
                                      `— { ${items[i].id} } ${items[i].itemName}`,
                                      `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Jeffros}${precio}`
                                    );

                                    if (i + 1 === fin) {
                                      return msg.edit(embed);
                                    }
                                  }
                                );
                              }
                            });
                          });
                        });
                      });
                    }
                  }
                );
              }
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
      Jeffros.findOne(
        {
          serverID: guild.id,
          userID: author.id
        },
        (err, currency) => {
          if (err) throw err;

          if (!currency) {
            let error1 = new Discord.MessageEmbed()
              .setAuthor(`| Error`, Config.errorPng)
              .setDescription(
                `**—** No tienes ${Emojis.Jeffros}effros, habla en <#${Config.mainChannel}> para ganarlos.`
              )
              .setColor(Colores.rojo);
          } else {
            Items.findOne(
              {
                serverID: guild.id,
                id: action
              },
              (err, item) => {
                if (err) throw err;

                if (!item) {
                  return message.reply(`ese item no existe.`);
                } else {
                  //embeds

                  // descuentos

                  let precio = item.itemPrice;

                  All.findOne(
                    {
                      userID: author.id,
                      itemID: action,
                      isDarkShop: false
                    },
                    (err, all) => {
                      if (all) {
                        precio =
                          Math.floor(item.itemPrice) + all.quantity * interest;

                        if (
                          message.member.roles.cache.find(
                            x => x.id === Config.lvl20
                          )
                        ) {
                          precio = Math.floor(item.itemPrice) + all.quantity * interest - ((Math.floor(item.itemPrice) + all.quantity * interest) / 100) * 15;
                        }
                      } else {
                        if (
                          message.member.roles.cache.find(
                            x => x.id === Config.lvl20
                          )
                        ) {
                          precio =
                            Math.floor(item.itemPrice) -
                            (Math.floor(item.itemPrice) / 100) * 15;
                        }
                      }

                      let doesntHaveRole = new Discord.MessageEmbed()
                        .setAuthor(`| Error`, Config.errorPng)
                        .setDescription(
                          `**—** Necesitas el role "<@&${item.roleRequired}>" para comprar \`${item.itemName}\`.`
                        )
                        .setColor(Colores.rojo);

                      let doesntHaveEnough = new Discord.MessageEmbed()
                        .setAuthor(`| Error`, Config.errorPng)
                        .setDescription(
                          `**—** Necesitas **${Emojis.Jeffros}${precio}** para comprar \`${item.itemName}\`. Tienes **${Emojis.Jeffros}${currency.jeffros}**.`
                        )
                        .setColor(Colores.rojo);

                      let hasRoleToGive = new Discord.MessageEmbed()
                        .setAuthor(`| Error`, Config.errorPng)
                        .setDescription(
                          `**—** Ya tienes el role que te da este item, no puedes comprar \`${item.itemName}\` otra vez.`
                        )
                        .setColor(Colores.rojo);

                      let hasThisItem = new Discord.MessageEmbed()
                        .setAuthor(`| Error`, Config.errorPng)
                        .setDescription(
                          `**—** Ya tienes \`${item.itemName}\`, úsalo con \`${prefix}usar ${item.id}\`.`
                        )
                        .setColor(Colores.rojo);

                      if (
                        item.roleRequired != "na" &&
                        !message.member.roles.cache.find(
                          x => x.id === item.roleRequired
                        )
                      )
                        return message.channel.send(doesntHaveRole); // si no tiene el role requerido

                      Use.findOne(
                        {
                          serverID: guild.id,
                          itemID: item.id
                        },
                        (err, use) => {
                          if (err) throw err;

                          if (!use) {
                            return message.channel.send(
                              `Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas comprar tu item :)`
                            );
                          }

                          if (
                            use.thingID != "na" &&
                            use.thing === "role" &&
                            message.member.roles.cache.find(
                              x => x.id === use.thingID
                            )
                          ) {
                            return message.channel.send(hasRoleToGive);
                          }
                          // revisando que tenga el dinero para pagar

                          if (currency.jeffros < precio)
                            return message.channel.send(doesntHaveEnough);

                          Purchased.findOne(
                            {
                              userID: author.id,
                              itemID: item.id
                            },
                            (err, purchase) => {
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
                                  msg
                                    .react(":allow:558084462232076312")
                                    .then(r => {
                                      msg.react(":denegar:558084461686947891");
                                    });

                                  let cancelEmbed = new Discord.MessageEmbed()
                                    .setDescription(`Cancelado.`)
                                    .setColor(Colores.nocolor);

                                  const yesFilter = (reaction, user) =>
                                    reaction.emoji.id ===
                                      "558084462232076312" &&
                                    user.id === message.author.id;
                                  const noFilter = (reaction, user) =>
                                    reaction.emoji.id ===
                                      "558084461686947891" &&
                                    user.id === message.author.id;

                                  const yes = msg.createReactionCollector(
                                    yesFilter,
                                    { time: 60000 }
                                  );
                                  const no = msg.createReactionCollector(
                                    noFilter,
                                    {
                                      time: 60000
                                    }
                                  );

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
                                // si ya tiene el item
                                return message.channel.send(hasThisItem);
                              }
                            }
                          );
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
                    `▸ El uso correcto es: /shop add <nombre> <precio> (@role requerido o ID)
**—** Para los roles, si no se necesita, rellenar con "\`na\`".`
                  )
                  .setColor(Colores.nocolor);

                if (!args[1]) return message.channel.send(errorEmbed);
                if (!args[2]) return message.channel.send(errorEmbed);
                if (!args[3]) return message.channel.send(errorEmbed);

                let nameItem = args[1];
                let priceItem = args[2];
                let reqRole = args[3];

                let lastID = c + plus;

                const newItem = new Items({
                  serverID: guild.id,
                  itemName: nameItem,
                  itemPrice: priceItem,
                  itemDescription: "na",
                  replyMessage: "¡Item usado con éxito!",
                  roleRequired: reqRole,
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
    } else 
      if(action === "ignore"){
        if(!args[1]) return message.reply("¿cuál es la id del item que se va a evitar subir el precio por compra?");
        let darkshopBool = true;
        if(!args[2]) darkshopBool = false;
        const newIgnore = new Ignore({
          itemID: args[1],
          isDarkShop: darkshopBool
        });
        
        newIgnore.save();
        
        message.react("✅").then(() => {
          if(darkshopBool){
            message.react("739625446961840129")
          }
        })
      }
  }
};

module.exports.help = {
  name: "shop",
  alias: "tienda"
};
