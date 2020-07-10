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
//const Items = require("../modelos/olditems.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  
  if(message.author.id != jeffreygID) return message.reply(`Comando en mantenimiento, vuelve más tarde!`);

  // Variables
  let author = message.author;
  const guild = message.guild;
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let subComando;
  
  let descuento = 1; // 1 si no hay descuento (se dividirá el precio entre este valor)

  /* ### PRECIOS ### */

  let soneWarnPRICE = 2000;
  let spermanentVIP_PRICE = 5000;
  let spersonalRolePRICE = 10000;

  let oneWarnPRICE = 2000;
  let permanentVIP_PRICE = 5000;
  let personalRolePRICE = 10000;

  /* ### PRECIOS ### */
  
  if(descuento != 1){
    soneWarnPRICE = `~~${oneWarnPRICE}~~ ${oneWarnPRICE / descuento}`;
    spermanentVIP_PRICE = `~~${permanentVIP_PRICE}~~ ${permanentVIP_PRICE / descuento}`;
    spersonalRolePRICE = `~~${personalRolePRICE}~~ ${personalRolePRICE / descuento}`;
    
    oneWarnPRICE = oneWarnPRICE / descuento;
    permanentVIP_PRICE = permanentVIP_PRICE / descuento;
    personalRolePRICE = personalRolePRICE / descuento;
  }

  /* ### DESCUENTOS ### */

  if (message.member.roles.cache.find(x => x.id === Config.lvl20)) {
    soneWarnPRICE = `~~${oneWarnPRICE}~~ ${oneWarnPRICE -
      (oneWarnPRICE / 100) * 15}`;
    spermanentVIP_PRICE = `~~${permanentVIP_PRICE}~~ ${permanentVIP_PRICE -
      (permanentVIP_PRICE / 100) * 15}`;
    spersonalRolePRICE = `~~${personalRolePRICE}~~ ${personalRolePRICE -
      (personalRolePRICE / 100) * 15}`;

    oneWarnPRICE = oneWarnPRICE - (oneWarnPRICE / 100) * 15;
    permanentVIP_PRICE = permanentVIP_PRICE - (permanentVIP_PRICE / 100) * 15;
    personalRolePRICE = personalRolePRICE - (personalRolePRICE / 100) * 15;
  }

  /* ### DESCUENTOS ### */

  let embed = new Discord.MessageEmbed()
    .setAuthor(`| Jeffrey Shop`, guild.iconURL())
    .setColor(Colores.verde)
    .setDescription(
      `▸ Bienvenid@ a la Jeffrey Shop, ${author.username}. Aquí puedes comprar diferentes cosas con los **${Emojis.Jeffros}effros**!
  ▸ Para ver todo los items de la tienda sólo haz \`${prefix}shop items\`.
▸ *(\`${prefix}shop #\` para comprar un item)*`
    )
    .setFooter(`Alias: ${prefix}tienda`);

  const filter = m => m.author.id === author.id;

  if (!args[0]) {
    return message.channel.send(embed);
  } else {
    subComando = args[0].toLowerCase();
  }

  if (subComando === "items" || subComando === "item") {
    let itemsEmbed = new Discord.MessageEmbed()
      .setAuthor(`| Items`, author.displayAvatarURL())
      .setColor(Colores.verde)
      .setDescription(
        `
**—** \`{ 1 }\` -1 Warn.
\`▸\` Si tienes un warn del mod que te cae mal, simplemente compra este item y se te restará el warn.
▸ ${Emojis.Jeffros}${soneWarnPRICE}

**—** \`{ 2 }\` VIP PERMANENTE.
\`▸\` Al comprar esto, se te agregará el rol VIP, además de darte acceso a una categoría privada, tienes la __OPCIÓN__ de recibir la notis de <#447813323149410304> antes que todos. Colores exclusivos activados. ¡Tendrás la posibilidad de conseguir hasta un **200%** más de EXP y Jeffros al hablar en <#${mainChannel}>!
▸ ${Emojis.Jeffros}${spermanentVIP_PRICE}`
      )
    
    /*
    

**—** \`{ 3 }\` Rol personalizado (anticipado)
\`▸\` Dicen que para tener un Rol personalizado hay que ser <@&461569305465847810>, pero, si compras esto puedes tenerlo mucho antes.
▸ ${Emojis.Jeffros}${spersonalRolePRICE}
*/

      .setFooter(`▸ { ### } es la id del item, el precio estará abajo.`);

    message.channel.send(itemsEmbed);
  } else
    if (subComando === "1") {
    // ###################### -1 WARN ###########################
    let buyEmbed = new Discord.MessageEmbed()
      .setAuthor(`| Compra`, guild.iconURL())
      .setColor(Colores.verde)
      .setDescription(
        `
\`▸\` ¿Estás seguro de comprar \`-1 Warn\` por **${Emojis.Jeffros}${oneWarnPRICE}**?
\`▸\` Reacciona de acuerdo a tu preferencia.`
      )
      .setFooter(
        `▸ Esta compra no se puede devolver.`,
        "https://cdn.discordapp.com/emojis/494267320097570837.png"
      );

    message.channel.send(buyEmbed).then(msg => {
      msg.react(":allow:558084462232076312").then(r => {
        msg.react(":denegar:558084461686947891");
      });

      let errorEmbed01 = new Discord.MessageEmbed() // No tienes warns.
        .setAuthor(`| Error`, Config.errorPng)
        .setColor(Colores.rojo).setDescription(`
\`▸\` Se ha producido un error: \`01\`.
\`▸\` No tienes warns, no puedes comprar este item.`);

      let errorEmbed02 = new Discord.MessageEmbed() // No tienes jeffros. || No tienes jeffros suficientes.
        .setAuthor(`| Error`, Config.errorPng)
        .setColor(Colores.rojo).setDescription(`
\`▸\` Se ha producido un error: \`02\`.
\`▸\` No tienes los ${Emojis.Jeffros}effros suficientes.`);

      let cancelEmbed = new Discord.MessageEmbed()
        .setDescription(`Cancelado.`)
        .setColor(Colores.rojo);

      const yesFilter = (reaction, user) =>
        reaction.emoji.id === "558084462232076312" &&
        user.id === message.author.id;
      const noFilter = (reaction, user) =>
        reaction.emoji.id === "558084461686947891" &&
        user.id === message.author.id;

      const yes = msg.createReactionCollector(yesFilter, { time: 60000 });
      const no = msg.createReactionCollector(noFilter, { time: 60000 });

      yes.on("collect", r => {
        Warn.findOne(
          {
            userID: author.id
          },
          (err, warns) => {
            if (err) throw err;
            if (!warns) {
              return msg.edit(errorEmbed01).then(a => {
                msg.reactions.removeAll();
              });
            } else if (warns.warns === 0) {
              return msg.edit(errorEmbed01).then(a => {
                msg.reactions.removeAll();
              });
            } else {
              Jeffros.findOne(
                {
                  userID: author.id,
                  serverID: guild.id
                },
                (err, jeffros) => {
                  if (err) throw err;
                  if (!jeffros) {
                    return msg.edit(errorEmbed02).then(a => {
                      msg.reactions.removeAll();
                    });
                  } else if (jeffros.jeffros < oneWarnPRICE) {
                    return msg.edit(errorEmbed02).then(a => {
                      msg.reactions.removeAll();
                    });
                  } else {
                    jeffros.jeffros = jeffros.jeffros - oneWarnPRICE;
                    jeffros.save().catch(e => console.log(e));

                    let pagadoEmbed = new Discord.MessageEmbed()
                      .setAuthor(`| Listo`, guild.iconURL())
                      .setColor(Colores.verde).setDescription(`
\`▸\` Pago realizado con éxito.
\`▸\` Compraste: \`-1 Warn\` por **${Emojis.Jeffros}${oneWarnPRICE}**.
      \`▸ Úsalo con '${prefix}usar 1'\` 
\`▸\` Ahora tienes: **${Emojis.Jeffros}${jeffros.jeffros}**.`);

                    Items.findOne(
                      {
                        userID: author.id
                      },
                      (err, items) => {
                        if (err) throw err;
                        if (!items) {
                          const newItems = new Items({
                            userID: author.id,
                            mOneWarn: 1,
                            vip: 0,
                            personalRole: 0
                          });

                          newItems.save().catch(e => console.log(e));
                        } else {
                          items.mOneWarn = items.mOneWarn + 1;
                          items.save().catch(e => console.log(e));
                        }
                      }
                    );

                    return msg.edit(pagadoEmbed).then(a => {
                      msg.reactions.removeAll();
                    });
                  }
                }
              );
            }
          }
        );
      });

      no.on("collect", r => {
        return msg.edit(cancelEmbed).then(a => {
          msg.reactions.removeAll();
          message.delete();
          a.delete(ms("20s"));
        });
      });
    });
  } else
    if (subComando === "2") {
    // #################### VIP ############################
    let buyEmbed = new Discord.MessageEmbed()
      .setAuthor(`| Compra`, guild.iconURL())
      .setColor(Colores.verde)
      .setDescription(
        `
\`▸\` ¿Estás seguro de comprar \`VIP PERMANENTE\` por **${Emojis.Jeffros}${permanentVIP_PRICE}**?
\`▸\` Reacciona de acuerdo a tu preferencia.`
      )
      .setFooter(
        `▸ Esta compra no se puede devolver.`,
        "https://cdn.discordapp.com/emojis/494267320097570837.png"
      );

    message.channel.send(buyEmbed).then(msg => {
      msg.react(":allow:558084462232076312").then(r => {
        msg.react(":denegar:558084461686947891");
      });

      let errorEmbed01 = new Discord.MessageEmbed() // Ya tienes VIP
        .setAuthor(`| Error`, Config.errorPng)
        .setColor(Colores.rojo).setDescription(`
\`▸\` Se ha producido un error: \`01\`.
\`▸\` Ya tienes VIP, no puedes volverlo a comprar.`);

      let errorEmbed02 = new Discord.MessageEmbed() // No tienes jeffros. || No tienes jeffros suficientes.
        .setAuthor(`| Error`, Config.errorPng)
        .setColor(Colores.rojo).setDescription(`
\`▸\` Se ha producido un error: \`02\`.
\`▸\` No tienes los ${Emojis.Jeffros}effros suficientes.`);

      let cancelEmbed = new Discord.MessageEmbed()
        .setDescription(`Cancelado.`)
        .setColor(Colores.rojo);

      const yesFilter = (reaction, user) =>
        reaction.emoji.id === "558084462232076312" &&
        user.id === message.author.id;
      const noFilter = (reaction, user) =>
        reaction.emoji.id === "558084461686947891" &&
        user.id === message.author.id;

      const yes = msg.createReactionCollector(yesFilter, { time: 60000 });
      const no = msg.createReactionCollector(noFilter, { time: 60000 });

      yes.on("collect", r => {
        Items.findOne(
          {
            userID: author.id
          },
          (err, i) => {
            if (err) throw err;

            if (!i || i.vip === 0) {
              Jeffros.findOne(
                {
                  userID: author.id,
                  serverID: guild.id
                },
                (err, jeffros) => {
                  if (err) throw err;
                  if (!jeffros) {
                    return msg.edit(errorEmbed02).then(a => {
                      msg.reactions.removeAll();
                    });
                  } else if (jeffros.jeffros < permanentVIP_PRICE) {
                    return msg.edit(errorEmbed02).then(a => {
                      msg.reactions.removeAll();
                    });
                  } else {
                    jeffros.jeffros = jeffros.jeffros - permanentVIP_PRICE;
                    jeffros.save().catch(e => console.log(e));

                    let pagadoEmbed = new Discord.MessageEmbed()
                      .setAuthor(`| Listo`, guild.iconURL())
                      .setColor(Colores.verde).setDescription(`
  \`▸\` Pago realizado con éxito.
  \`▸\` Compraste: \`VIP PERMANENTE\` por **${Emojis.Jeffros}${permanentVIP_PRICE}**.
    \`▸ Úsalo con '${prefix}usar 2'\` 
  \`▸\` Ahora tienes: **${Emojis.Jeffros}${jeffros.jeffros}**.`);

                    Items.findOne(
                      {
                        userID: author.id
                      },
                      (err, items) => {
                        if (err) throw err;
                        if (!items) {
                          const newItems = new Items({
                            userID: author.id,
                            mOneWarn: 0,
                            vip: 1,
                            personalRole: 0
                          });

                          newItems.save().catch(e => console.log(e));
                        } else {
                          items.vip = 1;
                          items.save().catch(e => console.log(e));
                        }
                      }
                    );

                    return msg.edit(pagadoEmbed).then(a => {
                      msg.reactions.removeAll();
                    });
                  }
                }
              );
            } else {
              if (i.vip === 1) {
                return message.channel.send(errorEmbed01);
              }
            }
          }
        );
      });
      no.on("collect", r => {
        return msg.edit(cancelEmbed).then(a => {
          msg.reactions.removeAll();
          message.delete();
          a.delete(ms("20s"));
        });
      });
    });
  }/* else
    if (subComando === "3") {
    // ###################### ROL PERSONALIZADO ##############################
    let buyEmbed = new Discord.MessageEmbed()
      .setAuthor(`| Compra`, guild.iconURL())
      .setColor(Colores.verde)
      .setDescription(
        `
\`▸\` ¿Estás seguro de comprar \`Rol personalizado\` por **${Emojis.Jeffros}${personalRolePRICE}**?
\`▸\` Reacciona de acuerdo a tu preferencia.`
      )
      .setFooter(
        `▸ Esta compra no se puede devolver.`,
        "https://cdn.discordapp.com/emojis/494267320097570837.png"
      );

    message.channel.send(buyEmbed).then(msg => {
      msg.react(":allow:558084462232076312").then(r => {
        msg.react(":denegar:558084461686947891");
      });

      let errorEmbed01 = new Discord.MessageEmbed() // Ya tienes tu rol
        .setAuthor(`| Error`, Config.errorPng)
        .setColor(Colores.rojo).setDescription(`
\`▸\` Se ha producido un error: \`01\`.
\`▸\` Ya tienes tu rol, no puedes volverlo a comprar.`);

      let errorEmbed02 = new Discord.MessageEmbed() // No tienes jeffros. || No tienes jeffros suficientes.
        .setAuthor(`| Error`, Config.errorPng)
        .setColor(Colores.rojo).setDescription(`
\`▸\` Se ha producido un error: \`02\`.
\`▸\` No tienes los ${Emojis.Jeffros}effros suficientes.`);

      let cancelEmbed = new Discord.MessageEmbed()
        .setDescription(`Cancelado.`)
        .setColor(Colores.rojo);

      const yesFilter = (reaction, user) =>
        reaction.emoji.id === "558084462232076312" &&
        user.id === message.author.id;
      const noFilter = (reaction, user) =>
        reaction.emoji.id === "558084461686947891" &&
        user.id === message.author.id;

      const yes = msg.createReactionCollector(yesFilter, { time: 60000 });
      const no = msg.createReactionCollector(noFilter, { time: 60000 });

      yes.on("collect", r => {
        Items.findOne(
          {
            userID: author.id
          },
          (err, i) => {
            if (err) throw err;
            if (i.personalRole === 1) {
              return message.channel.send(errorEmbed01);
            } else {
            }
          }
        );

        Jeffros.findOne(
          {
            userID: author.id,
            serverID: guild.id
          },
          (err, jeffros) => {
            if (err) throw err;
            if (!jeffros) {
              return msg.edit(errorEmbed02).then(a => {
                msg.reactions.removeAll();
              });
            } else if (jeffros.jeffros < personalRolePRICE) {
              return msg.edit(errorEmbed02).then(a => {
                msg.reactions.removeAll();
              });
            } else {
              jeffros.jeffros = jeffros.jeffros - personalRolePRICE;
              jeffros.save().catch(e => console.log(e));

              let pagadoEmbed = new Discord.MessageEmbed()
                .setAuthor(`| Listo`, guild.iconURL())
                .setColor(Colores.verde).setDescription(`
\`▸\` Pago realizado con éxito.
\`▸\` Compraste: \`Rol personalizado\` por **${Emojis.Jeffros}${personalRolePRICE}**.
  \`▸ Úsalo con '${prefix}usar 3'\` 
\`▸\` Ahora tienes: **${Emojis.Jeffros}${jeffros.jeffros}**.`);

              Items.findOne(
                {
                  userID: author.id
                },
                (err, items) => {
                  if (err) throw err;
                  if (!items) {
                    const newItems = new Items({
                      userID: author.id,
                      mOneWarn: 0,
                      vip: 0,
                      personalRole: 1
                    });

                    newItems.save().catch(e => console.log(e));
                  } else {
                    items.personalRole = 1;
                    items.save().catch(e => console.log(e));
                  }
                }
              );

              return msg.edit(pagadoEmbed).then(a => {
                msg.reactions.removeAll();
              });
            }
          }
        );
      });

      no.on("collect", r => {
        return msg.edit(cancelEmbed).then(a => {
          msg.reactions.removeAll();
          message.delete();
          a.delete(ms("20s"));
        });
      });
    });
  }*/
};

module.exports.help = {
  name: "shop",
  alias: "tienda"
};
