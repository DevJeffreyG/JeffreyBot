const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const Emojis = require("./../emojis.json");
const prefix = Config.prefix;
const mainChannel = Config.mainChannel;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Exp = require("../modelos/exp.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {
  if (!message.content.startsWith(prefix)) return;

  // Variables
  let author = message.author;
  const guild = message.guild;

  let noTopS = new Discord.MessageEmbed()
    .setAuthor(`| Tipo de Top`, author.displayAvatarURL())
    .setColor(Colores.nocolor)
    .setDescription(
      `**—** ¿Que tipo de Top quieres ver?
  \`▸\` Jeffros
  \`▸\` EXP`
    )
    .setFooter(
      `Responde en los próximos 10 segundos | "Cancelar" o "Cancel" para cancelar.`
    );

  let cancelE = new Discord.MessageEmbed()
    .setDescription(`Cancelado.`)
    .setColor(Colores.rojo);

  const filter = m => m.author.id === author.id;

  let selTop1 = args[0];
  if (!args[0]) {
    message.channel.send(noTopS).then(selectingTopMSG => {
      message.channel
        .awaitMessages(filter, { max: 1, time: 10000 })
        .then(collectedTop => {
          let messageID = message.channel.messages.fetch(selectingTopMSG.id);
          if (
            collectedTop.first().content.toLowerCase() === "cancel" ||
            collectedTop.first().content.toLowerCase() === "cancelar"
          ) {
            collectedTop.first().delete();
            return selectingTopMSG.edit(cancelE).then(r => r.delete(5000));
          }

          if (
            collectedTop.first().content.toLowerCase() === "jeffros" ||
            collectedTop.first().content.toLowerCase() === "j"
          ) {
            collectedTop.first().delete();
            Jeffros.find({
              serverID: guild.id
            })
              .sort([["jeffros", "descending"]])
              .exec((err, res) => {
                if (err) throw err;

                let jTop = new Discord.MessageEmbed().setAuthor(
                  `| Top de Jeffros`,
                  guild.iconURL()
                );

                // OBTENER LA POSICION DEL QUE USA EL COMANDO

                let n;
                let isIgnored = false;
                for (var i = 0; i < res.length; i++) {
                  let noMore = false;
                  if (!n) {
                    n = 0;
                  }

                  let member =
                    message.guild.members.cache.get(res[n].userID) ||
                    "(Dejó el servidor)";
                  if (member === "(Dejó el servidor)") {
                    n++;

                    noMore = true;
                  }

                  if (res[n].userID === author.id) {
                    let number = i + 1;
                    let yourRank;

                    switch (number) {
                      case 1:
                        yourRank = `🏆${number}ro`;
                        break;

                      case 2:
                        yourRank = `🥈${number}do`;
                        break;

                      case 3:
                        yourRank = `🥉${number}ro`;
                        break;

                      case 4:
                      case 5:
                      case 6:
                        yourRank = `${number}to`;
                        break;

                      case 7:
                      case 10:
                        yourRank = `${number}mo`;
                        break;

                      case 9:
                        yourRank = `${number}no`;
                        break;

                      default:
                        yourRank = `${number}vo`;
                        break;
                    }

                    jTop.setFooter(`Eres el ${yourRank} en el top.`);
                    i = res.length;
                  }

                  if (noMore === false) n++;
                }

                // Si no hay resultados
                if (res.length === 0) {
                  jTop.setColor(Colores.rojo);
                  jTop.setDescription(
                    `No se han encontrado ${Emojis.Jeffros}effros. Escribe en <#${mainChannel}> para ganarlos.`
                  );
                } else if (res.length < 5) {
                  // Menos de 5 resultados
                  jTop.setColor(Colores.verde);
                  let n;
                  let isIgnored = false;
                  for (i = 0; i < res.length; i++) {
                    let noMore = false;
                    if (!n) {
                      n = 0;
                    }

                    let member =
                      message.guild.members.cache.get(res[n].userID) ||
                      "(Dejó el servidor)";
                    if (member === "(Dejó el servidor)") {
                      n++;
                      i--;

                      isIgnored = true;
                      noMore = true;

                      /*jTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** ${Emojis.Jeffros}${res[i].jeffros}`
                );*/
                    } else {
                      if (n + 1 === 1) {
                        jTop.addField(
                          `🏆 ${member.user.username}`,
                          `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                        );
                      } else if (n + 1 === 2) {
                        jTop.addField(
                          `🥈 ${member.user.username}`,
                          `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                        );
                      } else if (n + 1 === 3) {
                        jTop.addField(
                          `🥉 ${member.user.username}`,
                          `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                        );
                      } else {
                        jTop.addField(
                          `${i + 1}. ${member.user.username}`,
                          `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                        );
                      }
                    }
                    if (noMore == false) n++;
                  }
                } else {
                  // Más de 5 resultados
                  jTop.setColor(Colores.verde);
                  let n;
                  let isIgnored = false;
                  for (i = 0; i < 5; i++) {
                    let noMore = false;
                    if (!n) {
                      n = 0;
                    }

                    let member =
                      message.guild.members.cache.get(res[n].userID) ||
                      "(Dejó el servidor)";
                    if (member === "(Dejó el servidor)") {
                      n++;
                      i--;

                      isIgnored = true;
                      noMore = true;

                      /*jTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** ${Emojis.Jeffros}${res[i].jeffros}`
                );*/
                    } else {
                      if (n + 1 === 1) {
                        jTop.addField(
                          `🏆 ${member.user.username}`,
                          `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                        );
                      } else if (n + 1 === 2) {
                        jTop.addField(
                          `🥈 ${member.user.username}`,
                          `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                        );
                      } else if (n + 1 === 3) {
                        jTop.addField(
                          `🥉 ${member.user.username}`,
                          `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                        );
                      } else {
                        jTop.addField(
                          `${i + 1}. ${member.user.username}`,
                          `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                        );
                      }
                    }
                    if (noMore == false) n++;
                  }
                }

                return selectingTopMSG.edit({embed: jTop}).then(r => r.delete(20000));
              });
          }

          if (
            collectedTop.first().content.toLowerCase() === "exp" ||
            collectedTop.first().content.toLowerCase() === "e" ||
            collectedTop.first().content.toLowerCase() === "ex"
          ) {
            collectedTop.first().delete();
            Exp.find({
              serverID: guild.id
            })
              .sort([["exp", "descending"]])
              .exec((err, res) => {
                if (err) throw err;

                let exTop = new Discord.MessageEmbed().setAuthor(
                  `| Top de EXP`,
                  guild.iconURL()
                );

                // OBTENER LA POSICION DEL QUE USA EL COMANDO

                let n;
                let isIgnored = false;
                for (var i = 0; i < res.length; i++) {
                  let noMore = false;
                  if (!n) {
                    n = 0;
                  }

                  let member =
                    message.guild.members.cache.get(res[n].userID) ||
                    "(Dejó el servidor)";
                  if (member === "(Dejó el servidor)") {
                    n++;

                    noMore = true;
                  }

                  if (res[n].userID === author.id) {
                    let number = i + 1;
                    let yourRank;

                    switch (number) {
                      case 1:
                        yourRank = `🏆${number}ro`;
                        break;

                      case 2:
                        yourRank = `🥈${number}do`;
                        break;

                      case 3:
                        yourRank = `🥉${number}ro`;
                        break;

                      case 4:
                      case 5:
                      case 6:
                        yourRank = `${number}to`;
                        break;

                      case 7:
                      case 10:
                        yourRank = `${number}mo`;
                        break;

                      case 9:
                        yourRank = `${number}no`;
                        break;

                      default:
                        yourRank = `${number}vo`;
                        break;
                    }

                    exTop.setFooter(`Eres el ${yourRank} en el top.`);
                    i = res.length;
                  }

                  if (noMore === false) n++;
                }

                // Si no hay resultados
                if (res.length === 0) {
                  exTop.setColor(Colores.rojo);
                  exTop.setDescription(
                    `No se ha encontrado EXP. Escribe en <#${mainChannel}> para ganarla.`
                  );
                } else if (res.length < 5) {
                  // Menos de 5 resultados
                  exTop.setColor(Colores.verde);
                  let n;
                  let isIgnored = false;
                  for (var i = 0; i < res.length; i++) {
                    let noMore = false;
                    if (!n) {
                      n = 0;
                    }

                    exTop.setColor(Colores.verde);
                    let member =
                      message.guild.members.cache.get(res[n].userID) ||
                      res[n].username + "(Dejó el servidor)";
                    if (member === res[n].username + "(Dejó el servidor)") {
                      n++;
                      i--;

                      isIgnored = true;
                      noMore = true;
                      /*exTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** Nivel: \`${res[i].level}\`\n**—** EXP: \`${res[i].exp}\``
                );*/
                    } else {
                      if (n + 1 === 1) {
                        exTop.addField(
                          `🏆 ${member.user.username}`,
                          `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                        );
                      } else if (n + 1 === 2) {
                        exTop.addField(
                          `🥈 ${member.user.username}`,
                          `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                        );
                      } else if (n + 1 === 3) {
                        exTop.addField(
                          `🥉 ${member.user.username}`,
                          `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                        );
                      } else {
                        exTop.addField(
                          `${i + 1}. ${member.user.username}`,
                          `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                        );
                      }
                    }
                    if (noMore === false) n++;
                  }
                } else {
                  // Más de 5 resultados
                  exTop.setColor(Colores.verde);
                  let n;
                  let isIgnored = false;
                  for (var i = 0; i < 5; i++) {
                    let noMore = false;
                    if (!n) {
                      n = 0;
                    }

                    exTop.setColor(Colores.verde);
                    let member =
                      message.guild.members.cache.get(res[n].userID) ||
                      res[n].username + "(Dejó el servidor)";
                    if (member === res[n].username + "(Dejó el servidor)") {
                      n++;
                      i--;

                      isIgnored = true;
                      noMore = true;
                      /*exTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** Nivel: \`${res[i].level}\`\n**—** EXP: \`${res[i].exp}\``
                );*/
                    } else {
                      if (n + 1 === 1) {
                        exTop.addField(
                          `🏆 ${member.user.username}`,
                          `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                        );
                      } else if (n + 1 === 2) {
                        exTop.addField(
                          `🥈 ${member.user.username}`,
                          `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                        );
                      } else if (n + 1 === 3) {
                        exTop.addField(
                          `🥉 ${member.user.username}`,
                          `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                        );
                      } else {
                        exTop.addField(
                          `${i + 1}. ${member.user.username}`,
                          `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                        );
                      }
                    }
                    if (noMore === false) n++;
                  }
                }

                return selectingTopMSG.edit({embed: exTop}).then(r => r.delete(20000));
              });
          }
        })
        .catch(e => message.reply("Han pasado los 10 segundos, cancelado."));
    });
  } else {
    let selTop = selTop1.toLowerCase();

    // /top jeffros
    if (selTop === "jeffros" || selTop === "j") {
      Jeffros.find({
        serverID: guild.id
      })
        .sort([["jeffros", "descending"]])
        .exec((err, res) => {
          if (err) throw err;

          let jTop = new Discord.MessageEmbed().setAuthor(
            `| Top de Jeffros`,
            guild.iconURL()
          );

          // OBTENER LA POSICION DEL QUE USA EL COMANDO

          let n;
          let isIgnored = false;
          for (var i = 0; i < res.length; i++) {
            let noMore = false;
            if (!n) {
              n = 0;
            }

            let member =
              message.guild.members.cache.get(res[n].userID) ||
              "(Dejó el servidor)";
            if (member === "(Dejó el servidor)") {
              n++;

              noMore = true;
            }

            if (res[n].userID === author.id) {
              let number = i + 1;
              let yourRank;

              switch (number) {
                case 1:
                  yourRank = `🏆${number}ro`;
                  break;

                case 2:
                  yourRank = `🥈${number}do`;
                  break;

                case 3:
                  yourRank = `🥉${number}ro`;
                  break;

                case 4:
                case 5:
                case 6:
                  yourRank = `${number}to`;
                  break;

                case 7:
                case 10:
                  yourRank = `${number}mo`;
                  break;

                case 9:
                  yourRank = `${number}no`;
                  break;

                default:
                  yourRank = `${number}vo`;
                  break;
              }

              jTop.setFooter(`Eres el ${yourRank} en el top.`);
              i = res.length;
            }

            if (noMore === false) n++;
          }

          // Si no hay resultados
          if (res.length === 0) {
            jTop.setColor(Colores.rojo);
            jTop.setDescription(
              `No se han encontrado ${Emojis.Jeffros}effros. Escribe en <#${mainChannel}> para ganarlos.`
            );
          } else if (res.length < 5) {
            // Menos de 5 resultados
            jTop.setColor(Colores.verde);
            let n;
            let isIgnored = false;
            for (i = 0; i < res.length; i++) {
              let noMore = false;
              if (!n) {
                n = 0;
              }

              let member =
                message.guild.members.cache.get(res[n].userID) ||
                "(Dejó el servidor)";
              if (member === "(Dejó el servidor)") {
                n++;
                i--;

                isIgnored = true;
                noMore = true;

                /*jTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** ${Emojis.Jeffros}${res[i].jeffros}`
                );*/
              } else {
                if (n + 1 === 1) {
                  jTop.addField(
                    `🏆 ${member.user.username}`,
                    `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                  );
                } else if (n + 1 === 2) {
                  jTop.addField(
                    `🥈 ${member.user.username}`,
                    `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                  );
                } else if (n + 1 === 3) {
                  jTop.addField(
                    `🥉 ${member.user.username}`,
                    `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                  );
                } else {
                  jTop.addField(
                    `${i + 1}. ${member.user.username}`,
                    `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                  );
                }
              }
              if (noMore == false) n++;
            }
          } else {
            // Más de 5 resultados
            jTop.setColor(Colores.verde);
            let n;
            let isIgnored = false;
            for (i = 0; i < 5; i++) {
              let noMore = false;
              if (!n) {
                n = 0;
              }

              let member =
                message.guild.members.cache.get(res[n].userID) ||
                "(Dejó el servidor)";
              if (member === "(Dejó el servidor)") {
                n++;
                i--;

                isIgnored = true;
                noMore = true;

                /*jTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** ${Emojis.Jeffros}${res[i].jeffros}`
                );*/
              } else {
                if (n + 1 === 1) {
                  jTop.addField(
                    `🏆 ${member.user.username}`,
                    `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                  );
                } else if (n + 1 === 2) {
                  jTop.addField(
                    `🥈 ${member.user.username}`,
                    `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                  );
                } else if (n + 1 === 3) {
                  jTop.addField(
                    `🥉 ${member.user.username}`,
                    `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                  );
                } else {
                  jTop.addField(
                    `${i + 1}. ${member.user.username}`,
                    `**—** ${Emojis.Jeffros}${res[n].jeffros}`
                  );
                }
              }
              if (noMore == false) n++;
            }
          }

          return message.channel.send(jTop);
        });
    }

    // top exp
    if (selTop === "exp" || selTop === "e" || selTop === "ex") {
      Exp.find({
        serverID: guild.id
      })
        .sort([["exp", "descending"]])
        .exec((err, res) => {
          if (err) throw err;

          let exTop = new Discord.MessageEmbed().setAuthor(
            `| Top de EXP`,
            guild.iconURL()
          );

          // OBTENER LA POSICION DEL QUE USA EL COMANDO

          let n;
          let isIgnored = false;
          for (var i = 0; i < res.length; i++) {
            let noMore = false;
            if (!n) {
              n = 0;
            }

            let member =
              message.guild.members.cache.get(res[n].userID) ||
              "(Dejó el servidor)";
            if (member === "(Dejó el servidor)") {
              n++;  

              noMore = true;
            }

            if (res[n].userID === author.id) {
              let number = i + 1;
              let yourRank;

              switch (number) {
                case 1:
                  yourRank = `🏆${number}ro`;
                  break;

                case 2:
                  yourRank = `🥈${number}do`;
                  break;

                case 3:
                  yourRank = `🥉${number}ro`;
                  break;

                case 4:
                case 5:
                case 6:
                  yourRank = `${number}to`;
                  break;

                case 7:
                case 10:
                  yourRank = `${number}mo`;
                  break;

                case 9:
                  yourRank = `${number}no`;
                  break;

                default:
                  yourRank = `${number}vo`;
                  break;
              }

              exTop.setFooter(`Eres el ${yourRank} en el top.`);
              i = res.length;
            }

            if (noMore === false) n++;
          }

          // Si no hay resultados
          if (res.length === 0) {
            exTop.setColor(Colores.rojo);
            exTop.setDescription(
              `No se ha encontrado EXP. Escribe en <#${mainChannel}> para ganarla.`
            );
          } else if (res.length < 5) {
            // Menos de 5 resultados
            exTop.setColor(Colores.verde);
            let n;
            let isIgnored = false;
            for (var i = 0; i < res.length; i++) {
              let noMore = false;
              if (!n) {
                n = 0;
              }

              exTop.setColor(Colores.verde);
              let member =
                message.guild.members.cache.get(res[n].userID) ||
                res[n].username + "(Dejó el servidor)";
              if (member === res[n].username + "(Dejó el servidor)") {
                n++;
                i--;

                isIgnored = true;
                noMore = true;
                /*exTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** Nivel: \`${res[i].level}\`\n**—** EXP: \`${res[i].exp}\``
                );*/
              } else {
                if (n + 1 === 1) {
                  exTop.addField(
                    `🏆 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else if (n + 1 === 2) {
                  exTop.addField(
                    `🥈 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else if (n + 1 === 3) {
                  exTop.addField(
                    `🥉 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else {
                  exTop.addField(
                    `${i + 1}. ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                }
              }
              if (noMore === false) n++;
            }
          } else {
            // Más de 5 resultados
            exTop.setColor(Colores.verde);
            let n;
            let isIgnored = false;
            for (var i = 0; i < 5; i++) {
              let noMore = false;
              if (!n) {
                n = 0;
              }

              exTop.setColor(Colores.verde);
              let member =
                message.guild.members.cache.get(res[n].userID) ||
                res[n].username + "(Dejó el servidor)";
              if (member === res[n].username + "(Dejó el servidor)") {
                n++;
                i--;

                isIgnored = true;
                noMore = true;
                /*exTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** Nivel: \`${res[i].level}\`\n**—** EXP: \`${res[i].exp}\``
                );*/
              } else {
                if (n + 1 === 1) {
                  exTop.addField(
                    `🏆 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else if (n + 1 === 2) {
                  exTop.addField(
                    `🥈 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else if (n + 1 === 3) {
                  exTop.addField(
                    `🥉 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else {
                  exTop.addField(
                    `${i + 1}. ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                }
              }
              if (noMore === false) n++;
            }

            return message.channel.send(exTop);
          }
        });
    }
  }
};

module.exports.help = {
  name: "top",
  alias: "tops"
};
