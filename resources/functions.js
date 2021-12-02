const Config = require("../base.json");
const Rainbow = require("./rainbow.json");
const Colores = require("./colores.json");
const Emojis = require("./emojis.json");
const Discord = require("discord.js");
const { Structures } = require('discord.js');
const anyBase = require("any-base");
const prettyms = require("pretty-ms");
const dec2hex = anyBase(anyBase.DEC, anyBase.HEX);

const fs = require("fs");
const ms = require("ms");
var Chance = require("chance");
var chance = new Chance();
const prettyMilliseconds = require("pretty-ms");

const moment = require('moment-timezone');
moment().tz("America/Bogota").format();

/* ##### MONGOOSE ######## */

const mongoose = require("mongoose");
mongoose.connect(`${process.env.MONGOCONNECT}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require("../modelos/User.model.js");
const DarkShop = require("../modelos/DarkShop.model.js");
const Shop = require("../modelos/Shop.model.js");

const Jeffros = require("../modelos/jeffros.js");
const Exp = require("../modelos/exp.js");
const AutoRole = require("../modelos/autorole.js");
const Toggle = require("../modelos/toggle.js");
const Warn = require("../modelos/warn.js");
const DarkItems = require("../modelos/darkitems.js");
const Vault = require("../modelos/vault.js");
const WinVault = require("../modelos/winVault.js");
const Hint = require("../modelos/hint.js");
const GlobalData = require("../modelos/globalData.js");
const Stats = require("../modelos/darkstats.js");
const All = require("../modelos/allpurchases.js");
const testingGuild = "482989052136652800";

// JEFFREY BOT NOTIFICATIONS
const { google } = require("googleapis");
const Twitter = require("twitter");
const { ApiClient } = require("twitch");
const { StaticAuthProvider } = require("twitch-auth");
const request = require("request");

/* ##### MONGOOSE ######## */

const findLvls5 = async function(client, guild){
  let role = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "791006500973576262") : guild.roles.cache.find(x => x.id === Config.dsRole);
  Exp.find({
    serverID: guild.id
  }, async (err, exps) => {
    if(err) throw err;

    if(!exps) return;

    for(let i = 0; i < exps.length; i++){
      let exp = exps[i];
      let member = guild.members.cache.find(x => x.id === exp.userID);

      if(exp.level >= 5){
        if(member && !member.roles.cache.find(x => x.id === role.id)) await member.roles.add(role);
      }
    }
  })
}

const getChanges = function(entryChanges) {
  switch (entryChanges.key) {
    case "afk_timeout":
      oldKey = `**${entryChanges.old / 60}** minutos`;
      newKey = `**${entryChanges.new / 60}** minutos`;

      break;

    case "mfa_level":
      oldKey = entryChanges.old ? "**Sí**" : "**No**";
      newKey = entryChanges.new ? "**Sí**" : "**No**";
      break;

    case "verification_level":
      oldKey = `Nivel **${entryChanges.old}**`;
      newKey = `Nivel **${entryChanges.new}**`;
      break;

    case "explicit_content_filter":
      oldKey = `Nivel **${entryChanges.old + 1}**`;
      newKey = `Nivel **${entryChanges.new + 1}**`;
      break;

    case "default_message_notifications":
      oldKey =
        entryChanges.old === 1
          ? `**Sólo menciones**`
          : `**Todos los mensajes**`;
      newKey =
        entryChanges.new === 1
          ? `**Sólo menciones**`
          : `**Todos los mensajes**`;
      break;

    case "prune_delete_days":
      oldKey = `**${entryChanges.old}** días`;
      newKey = `**${entryChanges.new}** días`;
      break;

    case "afk_channel_id":
      oldKey = guild.channels.cache.get(entryChanges.old)
        ? `**${guild.channels.cache.get(entryChanges.old)}**`
        : "**Nulo**";
      newKey = guild.channels.cache.get(entryChanges.new)
        ? `**${guild.channels.cache.get(entryChanges.new)}**`
        : "**Nulo**";
      break;

    case "owner_id":
      oldKey = guild.members.cache.get(entryChanges.old)
        ? `**${guild.members.cache.get(entryChanges.old)}**`
        : "**Nulo**";
      newKey = guild.members.cache.get(entryChanges.new)
        ? `**${guild.members.cache.get(entryChanges.new)}**`
        : "**Nulo**";
      break;

    case "rate_limit_per_user":
      oldKey = entryChanges.old
        ? `**${entryChanges.old}** segundos`
        : "**Nulo**";
      newKey = entryChanges.new
        ? `**${entryChanges.new}** segundos`
        : "**Nulo**";
      break;

    default:
      oldKey = "**" + entryChanges.old + "**" || "**Nulo**";
      newKey = "**" + entryChanges.new + "**" || "**Nulo**";
  }
  return { old: oldKey, new: newKey };
}

/**
 * 
 * @param {boolean} [justTempRoles=false] Just execute interval of temporal roles
 * @returns void
 */
const intervalGlobalDatas = async function(client, justTempRoles){
  justTempRoles = justTempRoles || false;

  let guild;
  let bdRole;
  let logs;
  let dsChannel = client.channels.cache.find(x => x.id === Config.dsChannel);
  let dsNews;

  if(client.user.id === Config.testingJBID){
    guild = client.guilds.cache.find(x => x.id === "482989052136652800");
    bdRole = guild.roles.cache.find(x => x.id === "544687105977090061");
    logs = guild.channels.cache.find(x => x.id === "483108734604804107");
    dsNews = guild.roles.cache.find(x => x.id === "790431614378704906");
    dsChannel = client.channels.cache.find(x => x.id === "790431676970041356");
  } else {
    guild = client.guilds.cache.find(x => x.id === Config.jgServer);
    bdRole = guild.roles.cache.find(x => x.id === Config.bdRole);
    logs = guild.channels.cache.find(x => x.id === Config.logChannel);
    dsNews = guild.roles.cache.find(x => x.id === Config.dsnews);
  }

  await guild.members.fetch();
  let members = guild.members.cache;
  // buscar roles temporales
  members.forEach(async (member) => {
    let dbUser = await User.findOne({
      user_id: member.id,
      guild_id: guild.id
    });

    let roles = (dbUser && dbUser.data.temp_roles) ?? false;

    if(roles) {
      for (let i = 0; i < dbUser.data.temp_roles.length; i++){
        const temprole = dbUser.data.temp_roles[i];
        let role = guild.roles.cache.find(x => x.id === temprole.role_id);
        let since = temprole.active_since;
        let realDuration = temprole.duration;
        let today = new Date();

        if(today - since >= realDuration){

          if(!temprole.isSub){
            // sacarle el role
            console.log("TEMPROLE, Ha pasado el tiempo 0001")
            member.roles.remove(role);

            // eliminar el temprole de la db
            dbUser.data.temp_roles.splice(i, 1);
            dbUser.save();
          } else { // es una suscripción
            let price = Number(temprole.sub_info.price);
            let subName = temprole.sub_info.name;
            let isCancelled = temprole.sub_info.isCancelled;

            let notEnough = new Discord.MessageEmbed()
            .setAuthor(`Error`, Config.errorPng)
            .setDescription(`**—** No tienes suficientes Jeffros **(${Emojis.Jeffros}${price.toLocaleString('es-CO')})** para pagar la suscripción a \`${subName}\`.
**—** Tu saldo ha quedado en **alerta roja**.`)
            .setColor(Colores.rojo);

            if(isCancelled){
              member.roles.remove(role);

              // eliminar el temprole de la db
              dbUser.data.temp_roles.splice(i, 1);
              dbUser.save();
            } else {
              // cobrar jeffros
              let jeffros = dbUser.economy.global;

              let paidEmbed = new Discord.MessageEmbed()
              .setAuthor(`Pagado`, Config.bienPng)
              .setDescription(`**—** Has pagado **${Emojis.Jeffros}${price.toLocaleString('es-CO')}** para pagar la suscripción a \`${subName}\`.
              **—** Tu saldo ha quedado en **${Emojis.Jeffros}${(jeffros.jeffros - price).toLocaleString('es-CO')}**.`)
              .setColor(Colores.verde);

              if(!jeffros || jeffros.jeffros < price){
                // quitarle los jeffros, y dejarlo en negativo
                console.log(jeffros.userID, "ha quedado en negativos por no poder pagar", subName);
                jeffros.jeffros -= price;
                member.send({embeds: [notEnough]});
                
                // eliminar el temprole de la db
                dbUser.data.temp_roles.splice(i, 1);

                member.roles.remove(role);
                dbUser.save();
              } else { // cobrar
                jeffros.jeffros -= price;
                dbUser.save();

                // actualizar el globaldata
                temprole.active_since = today;
                dbUser.save();

                member.send({embeds: [paidEmbed]});
              }
            }
          }
        }
      }
    }
  })

  if(justTempRoles === true) return;

  /** ###### DARKSHOP ###### */
  await DarkShopWork(client, guild.id);

  /** ###### DARKSHOP ###### */

  // buscar temp bans
  GlobalData.find({
    "info.type": "temporalGuildBan",
    "info.serverID": guild.id
  }, (err, tempBans) => {
    if(err) throw err;

    if(tempBans){
      for (let i = 0; i < tempBans.length; i++){
        let ban = tempBans[i];
        let userID = ban.info.userID;
        let since = ban.info.since;
        let realDuration = ban.info.duration;
        let today = new Date();

        if(today - since >= realDuration){
          // ya pasó el tiempo, unban
          guild.members.unban(userID);
          tempBans[i].remove();

          let unBEmbed = new Discord.MessageEmbed()
          .setAuthor(`Unban`, guild.iconURL())
          .setDescription(`
        **—** Usuario desbaneado: **${userID}**.
        **—** Razón: **${ban.info.reason}**.
            `)
          .setColor(Colores.verde);

          logs.send({embeds: [unBEmbed]})
          console.log("Se ha desbaneado a", userID)
        } else {
          // nada XD
        }
      }
    }
  })

  // buscar usuarios de cumpleaños
  GlobalData.find({
    "info.type": "birthdayData"
  }, (err, birthdays) => {
    if(birthdays){
      for (let i = 0; i < birthdays.length; i++){
        let bd = birthdays[i];
        let member = guild.members.cache.find(x => x.id === bd.info.userID);
        let bdDay = bd.info.birthd;
        let bdMonth = bd.info.birthm;
        let isLocked = bd.info.isLocked ?? false;

        if(isLocked) {
          if(bdDay && bdMonth){
              let now = new Date();
              let actualDay = now.getDate();
              let actualMonth = now.getMonth();

              if((actualDay == bdDay) && (actualMonth + 1 == bdMonth)){ // actualMonth + 1 ( 0 = ENERO && 11 = DICIEMBRE )
                // ES EL CUMPLEAÑOS
                if(!member.roles.cache.find(x => x.id === bdRole.id)) member.roles.add(bdRole);
              } else {
                // revisar si tiene el rol de cumpleaños, entonces quitarselo
                if(member.roles.cache.find(x => x.id === bdRole.id)) member.roles.remove(bdRole);
              }
            }
        }
      }
    }
  })
  return;
}

/**
 * Add warns to an user
 * @param {string} v The ID of the user
 * @param {number} c The number of warns to add
 */
const Warns = function (v, c){
    Warn.findOne({
        userID: v.id
    }, (err, victimWarns) => {
        if(err) throw err;

        if(!victimWarns) {
            const newWarn = new Warn({
                userID: v.id,
                warns: c
            });
            newWarn.save();
        } else {
            victimtotalWarns += c;
            victimWarns.save();
        }
    })
}

/**
 * Add Interest if the item does not ignore it.
 * @param {Object[]} author The Discord.JS User
 * @param {number} idUse The ID of the item to check
 */
const Interest = function (author, idUse) {
    DarkItems.findOne({
        id: idUse
    }, (err, item) => {
        All.findOne({
            userID: author.id,
            itemID: idUse
        }, (err, alli) => {

            if(item.ignoreInterest == false && !alli){
                const newAll = new All({
                    userID: author.id,
                    itemID: idUse,
                    quantity: 1,
                    isDarkShop: true
                });

                return newAll.save();
            } else if (item.ignoreInterest == false && alli){
                alli.quantity += 1;
                return alli.save();
            } else {
                // no hacer nada, se ignora el interés
                return;
            }
        })
    })
}

/**
 * Adds a temporary role into the database ands adds the role to the user.
 * @param {Object[]} guild - The Discord.JS Guild
 * @param {string} roleID - The ID of the temporary role
 * @param {Object[]} victimMember - The Discord.JS Member
 * @param {Object[]} user - The mongoose User.Model
 * @param {(number | string)} duration The duration of the temporary role in ms.
 * - "permanent" for not being an temporary role.
 * @param {string} [specialType=false] The special type of this temporary role.
 * - boostMultiplier
 * - boostProbabilities
 * @param {string} [specialObjective=false] The objetive for this special type of temporary role.
 * - exp
 * - jeffros
 * - all
 * @param {number} [specialValue=false] The value for the objetive of this special temporary role.
 * @returns void
 */
const LimitedTime = async function(guild, roleID, victimMember, user, duration, specialType, specialObjective, specialValue){
    specialType = specialType || null;
    specialObjective = specialObjective || null;
    specialValue = specialValue || null;

    let role = guild.roles.cache.find(x => x.id === roleID);

    if(duration === Infinity) return victimMember.roles.add(role); // es un role permanente???

    let hoy = new Date();

    let toPush = {
      role_id: roleID,
      active_since: hoy,
      duration: duration,
      special: {
        type: specialType,
        objetive: specialObjective,
        value: specialValue
      }
    }

    user.data.temp_roles.push(toPush);
    await user.save();

    let lastAddedIndex = user.data.temp_roles.length - 1;
    victimMember.roles.add(role);

    // timeout, por si pasa el tiempo antes de que el bot pueda reiniciarse
    setTimeout(function(){
      victimMember.roles.remove(role);

      user.data.temp_roles.splice(lastAddedIndex, 1);
      user.save()
    }, duration);
}

/**
 * Adds a new subscription to the database and adds the role to the user.
 * @param {object[]} guild The Discord.JS Guild
 * @param {string} roleID The ID for the role given by the suscription
 * @param {object[]} victimMember The Discord.JS GuildMember
 * @param {string} intervalTime The interval of time in which the user will pay
 * - "1d", "30d", "10m"
 * @param {string} jeffrosPerInterval The price the user will pay every interval
 * @param {string} subscriptionName The name of the suscription
 * @returns 
 */
const Subscription = function(guild, roleID, victimMember, intervalTime, jeffrosPerInterval, subscriptionName){
    let role = guild.roles.cache.find(x => x.id === roleID);

    if(intervalTime === "permanent" || intervalTime === "na"){
      // no es una sub
      return console.error("Using Subscription() with erroneous interval.");
    } else {
      let hoy = new Date();

      const newData = new GlobalData({
        info: {
          type: "jeffrosSubscription",
          roleID: roleID,
          userID: victimMember.id,
          since: hoy,
          interval: ms(intervalTime),
          price: jeffrosPerInterval,
          subName: subscriptionName,
          isCancelled: false
        }
      })

      victimMember.roles.add(role);
      newData.save();
    }
}

const VaultWork = function(vault, user, message, notCodeEmbed){ // mostrar y buscar un codigo no descifrado aún por el usuario
  if(user.data.unlockedVaults.length === vault.codes.length) return message.channel.send({content: `${message.member}`, embeds: [notCodeEmbed]}).then(m => {
    setTimeout(() => {
    m.delete();
    message.delete();
    }, ms("10s"));
  });

  const unlocked = user.data.unlockedVaults;

  let code = vault.codes[Math.floor(Math.random() * vault.codes.length)];
  
  while(unlocked.find(x => x === code.id)){
    code = vault.codes[Math.floor(Math.random() * vault.codes.length)];
  }

  const totalhints = code.hints.length;
  let pistan = 1;

  const embed = new Discord.MessageEmbed()
  .setColor(Colores.verde)
  .setFooter(`Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`)
  .setDescription(code.hints[pistan - 1]);

  return message.reply({embeds: [embed]}).then(msg => {
    msg.react("⏪").then(r => {
      msg.react("⏩");

      const backwardsFilter = (reaction, user) => reaction.emoji.name === "⏪" && user.id === message.author.id;
      const forwardsFilter = (reaction, user) => reaction.emoji.name === "⏩" && user.id === message.author.id;
      const collectorFilter = (reaction, user) => (reaction.emoji.name === "⏪" || reaction.emoji.name === "⏩") && user.id === message.author.id;

      const backwards = msg.createReactionCollector({ filter:backwardsFilter, time: 60000 });
      const forwards = msg.createReactionCollector({ filter:forwardsFilter, time: 60000 });
      const collector = msg.createReactionCollector({ filter:collectorFilter, time: 60000 });

      collector.on("end", r => {
        return msg.reactions.removeAll()
        .then(() => {
          msg.react("795090708478033950");
        });
      });

      backwards.on("collect", async (r, user) => {
        let reactions = r.message.reactions.cache.find(x => x.emoji.name === "⏪");

        if (pistan === 1) return reactions.users.remove(user.id);;
        pistan--;
        embed.setFooter(
          `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
        );
        embed.setDescription(code.hints[pistan - 1]);
        await msg.edit({embeds: [embed]});

        reactions.users.remove(user.id);;
      });

      forwards.on("collect", async (r, user) => {
        let reactions = r.message.reactions.cache.find(x => x.emoji.name === "⏩");

        if (pistan === code.hints.length) return reactions.users.remove(user.id);;
        pistan++;
        embed.setFooter(
          `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
        );
        embed.setDescription(code.hints[pistan - 1]);

        await msg.edit({embeds: [embed]});
        
        reactions.users.remove(user.id);;
      });
    });
  });

}

const vaultMode = function(hint, author, message) { // tengo que rehacer esto XD
    console.log(hint);
      Vault.find({}, function(err, pistas) {
        if (pistas.length === 0) {
          return message.reply(`No deberías estar aquí.`);
        }

        Vault.findOne(
          {
            id: hint
          },
          (err, pista1) => {
            if (err) throw err;
            Hint.countDocuments(
              {
                codeID: pista1.id
              },
              (err, totalhints) => {
                Hint.find({
                  codeID: pista1.id
                })
                  .sort([["num", "ascending"]])
                  .exec((err, pista) => {
                    // captcha si el código ya se descifró.

                    WinVault.findOne(
                      {
                        codeID: pista[0].codeID,
                        userID: author.id
                      },
                      (err, won) => {
                        //console.log(`${pista1.code}: ${pista1.id} || ${pista[0].hint}`);
                        if (!won) {
                          let pistan = 1;

                          const embed = new Discord.MessageEmbed()
                            .setColor(Colores.verde)
                            .setFooter(
                              `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
                            )
                            .setDescription(pista[pistan - 1].hint);

                          message.channel.send({embeds: [embed]}).then(msg => {
                            msg.react("⏪").then(r => {
                              msg.react("⏩");

                              const backwardsFilter = (reaction, user) => reaction.emoji.name === "⏪" && user.id === message.author.id;
                              const forwardsFilter = (reaction, user) => reaction.emoji.name === "⏩" && user.id === message.author.id;
                              const collectorFilter = (reaction, user) => (reaction.emoji.name === "⏪" || reaction.emoji.name === "⏩") && user.id === message.author.id;

                              const backwards = msg.createReactionCollector({ filter:backwardsFilter, time: 60000 });
                              const forwards = msg.createReactionCollector({ filter:forwardsFilter, time: 60000 });
                              const collector = msg.createReactionCollector({ filter:collectorFilter, time: 60000 });

                              collector.on("end", r => {
                                return msg.reactions.removeAll()
                                .then(() => {
                                  msg.react("795090708478033950");
                                });
                              });

                              backwards.on("collect", r => {
                                if (pistan === 1) return;
                                pistan--;
                                embed.setFooter(
                                  `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
                                );
                                embed.setDescription(pista[pistan - 1].hint);
                                msg.edit({embeds: [embed]});
                              });

                              forwards.on("collect", r => {
                                if (pistan === pista.length) return;
                                pistan++;
                                embed.setFooter(
                                  `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
                                );
                                embed.setDescription(pista[pistan - 1].hint);

                                msg.edit({embeds: [embed]});
                              });
                            });
                          });
                        } else {
                          let respRelleno = [
                            "Jeffrey sube vídeo",
                            "No seas malo",
                            "Las rosas son rojas",
                            "Los caballos comen manzanas",
                            "siganme en twitter xfa @pewdiepie",
                            "No tengo plata. ¿me donan?",
                            "Mindblowing"
                          ];

                          let relleno =
                            respRelleno[
                              Math.floor(Math.random() * respRelleno.length)
                            ];

                          let r = new Discord.MessageEmbed()
                            .setDescription(relleno)
                            .setColor(Colores.blanco);

                          return message.channel
                            .send({embeds: [r]})
                            .then(m => {
                              setTimeout(() => {
                                m.delete();
                              }, ms("5s"));
                            });
                        }
                      }
                    );
                  });
              }
            );
          }
        );
      });
}

const handleUploads = async function(client){
  let guild, bellytChannel, belltwChannel, belltvChannel, role;

  if(client.user.id === Config.testingJBID){
    guild = client.guilds.cache.find(x => x.id === "482989052136652800");
    bellytChannel = client.channels.cache.find(x => x.id === "881031615084634182");
    belltwChannel = client.channels.cache.find(x => x.id === "881031732369960990");
    belltvChannel = client.channels.cache.find(x => x.id === "881031774174588968");
    role = guild.roles.cache.find(x => x.id === "881028196282290256")
  } else {
    bellytChannel = client.channels.cache.find(x => x.id === Config.bellytChannel);
    belltwChannel = client.channels.cache.find(x => x.id === Config.belltwChannel);
    belltvChannel = client.channels.cache.find(x => x.id === Config.belltvChannel);
    role = guild.roles.cache.find(x => x.id === Config.bellRole)
  }

  // revisar si existe el globaldata
  let interval = ms("30s");
  let query = await GlobalData.findOne({
    "info.type": "bellNotification"
  });

  if (!query){
    const newNotification = new GlobalData({
      info: {
        type: "bellNotification",
        postedVideos: [{"what": "DELETETHIS"}],
        postedTweets: [{"what": "DELETETHIS"}],
        postedOnLive: [{"what": "DELETETHIS"}]
      }
    })

    await newNotification.save();
    query = await GlobalData.findOne({
      "info.type": "bellNotification"
    });
  }
    
  setInterval(async () => {

        let config = {
          youtube_channelId: "UCCYiF7GGja7iJgsc4LN0oHw",
          twitter_screenname: "JeffreyG__",
          twitch_username: "jeffreyg_"
        }
    
        // youtube
        let comentarios = ["Ha llegado el momento, chécalo para evitar que Jeffrey entre en depresión", "Dale like o comenta algo si te gustó lo suficiente :D", "Espero que nos veamos en la próxima, ¡y que no sea en 3 meses!", "BROOOO Está rebueno míralo, a lo bien.", "No sabría decir si es lamentable, espero que no, ¿por qué no lo ves para comprobarlo y me dices qué tal?"]
        let comentario = comentarios[Math.floor(Math.random() * comentarios.length)];
        
        google.youtube("v3").activities.list({
          key: process.env.YOUTUBE_TOKEN,
          part: "snippet, contentDetails",
          channelId: config.youtube_channelId
        })
        .then(async response => {
          //console.log(response.data.items[0])
          let item;
          
          itemLoop:
          for (let i = 0; i < response.data.items.length; i++) {
            const _item = response.data.items[i];
            
            if(_item.snippet.type === "upload"){
              item = response.data.items[i];
              break itemLoop;
            } else {
              item = null;
            }
          }
          
          if(!item) return;
          
          const data = item.snippet;
          const itemId = item.id;
          const videoId = item.contentDetails.upload.videoId;

          let noti = await GlobalData.findOne({
            "info.type": "bellNotification"
          });

          let posted = false;

          lastlinkLoop:
          for (let i = 0; i < noti.info.postedVideos.length; i++) {
            const video = noti.info.postedVideos[i];
            
            if(video.id === itemId){
              posted = true;
              break lastlinkLoop;
            }
          }

          if (noti.info.postedVideos && posted) return;
            else {

              const videoLink = `https://www.youtube.com/watch?v=${videoId}`;

              let toPush = {
                  title: data.title,
                  id: itemId,
                  link: videoLink,
                  author: data.channelTitle
              }

              if((noti.info.postedVideos.length === 1 && noti.info.postedVideos[0].what) || !noti.info.postedVideos){
                noti.info.postedVideos[0] = toPush;
              } else {
                noti.info.postedVideos.push(toPush);
              }

              noti.markModified("info");
              await noti.save();

              let parsed = noti.info.postedVideos[noti.info.postedVideos.length -1];
              if (!bellytChannel) return;

              bellytChannel.send({content: `**:fire::zap:️¡NUEVO VÍDEO, ${role}!:zap:️:fire:**\n\n${comentario}\n\n➟ ${parsed.link}`});
            }

        })
        .catch(err => console.log("YOUTUBE", err));

        // twitter
        const twitterClient = new Twitter({
          consumer_key: process.env.TWITTER_API,
          consumer_secret: process.env.TWITTER_SECRET,
          access_token_key: process.env.TWITTER_ACCESS_TOKEN,
          access_token_secret: process.env.TWITTER_ACCESS_SECRET
        });

        twitterClient.get('statuses/user_timeline', {screen_name: config.twitter_screenname, count: 5}, async function(error, tweets, response) {
          if(error) throw error;
          const tweet = tweets[0]; // ultimo tweet de {config.twitter_screenname}
          const tweetId = tweet.id_str;
          const link = `https://twitter.com/${config.twitter_screenname}/status/${tweetId}`;

          let noti = await GlobalData.findOne({
            "info.type": "bellNotification"
          });

          let posted = false;
          lastlinkLoop:
          for (let i = 0; i < noti.info.postedTweets.length; i++) {
            const _tweet = noti.info.postedTweets[i];
            
            if(_tweet.id === tweetId){
              posted = true;
              break lastlinkLoop;
            }
          }

          if (noti.info.postedTweets && posted) return;
          else {
            let toPush = {
                id: tweetId,
                link: link,
                author: tweet.user.screen_name,
                time: tweet.created_at
            }

            if((noti.info.postedTweets.length === 1 && noti.info.postedTweets[0].what) || !noti.info.postedTweets){
              noti.info.postedTweets[0] = toPush;
            } else {
              noti.info.postedTweets.push(toPush);
            }

            noti.markModified("info");
            await noti.save();

            let parsed = noti.info.postedTweets[noti.info.postedTweets.length -1];
            let tweetDate = new Date(parsed.time)
            let time = moment(tweetDate).tz("America/Bogota");

            if (!belltwChannel) return;

            belltwChannel.send(`Jeffrey escribió un tweet **(${time})**\n\n\`[\` ${parsed.link} \`]\``);
          }

       });

        // twitch
        let saludos = ["Di hola", "Ven y saluda", "Llégate", "Esto no pasa todo el tiempo, ven"]
        let saludo = saludos[Math.floor(Math.random() * saludos.length)];
        const streamLink = `https://twitch.tv/${config.twitch_username}`;

        const options = {
          url: 'https://id.twitch.tv/oauth2/token',
          json: true,
          body: {
            client_id: process.env.TWITCH_CLIENT,
            client_secret: process.env.TWITCH_SECRET,
            grant_type: 'client_credentials'
          }
        }

        request.post(options, async (err, res, body) => {
          if(err) throw err;
          const accessTokenTwitch = body.access_token;

          const authProvider = new StaticAuthProvider(process.env.TWITCH_CLIENT, accessTokenTwitch);
          const apiClient = new ApiClient({ authProvider });
          
          let streaming = await isStreaming(config.twitch_username);
          if(streaming){ // si está directo
            const stream = await getHelixStream(config.twitch_username);
            const streamId = stream.id;
            const streamTitle = stream.title;

            let noti = await GlobalData.findOne({
              "info.type": "bellNotification"
            });

            let posted = false;

            lastVod:
            for (let i = 0; i < noti.info.postedOnLive.length; i++) {
              const _stream = noti.info.postedOnLive[i];
              
              if(_stream.id === streamId){
                posted = true;
                break lastVod;
              }
            }

            if(noti.info.postedOnLive && posted) return;
            else {
              let toPush = {
                title: streamTitle,
                link: streamLink,
                id: streamId
              }

              if((noti.info.postedOnLive.length === 1 && noti.info.postedOnLive[0].what) || !noti.info.postedOnLive){
                noti.info.postedOnLive[0] = toPush;
              } else {
                noti.info.postedOnLive.push(toPush);
              }

              noti.markModified("info");
              await noti.save();

              let parsed = noti.info.postedOnLive[noti.info.postedOnLive.length -1];
              if (!belltvChannel) return;

              belltvChannel.send(`**🔴 ¡Jeffrey está en directo, ${role}!** 🔴\n\`➟\` **${parsed.title}**\n\n**${saludo} ➟ ${parsed.link} !! :D**`);
            }
          }

          async function isStreaming(username) {
            const user = await apiClient.helix.users.getUserByName(username);
            if (!user) {
              return false;
            }
            return await user.getStream() !== null;
          }

          async function getHelixStream(username){
            const user = await apiClient.helix.users.getUserByName(username);

            if(!user) return null;

            const stream = await user.getStream()

            if(!stream) return null;

            return stream;
          }
      })
    }, interval);
}

/**
 * Initialize the base variables used on the commands.
 * @param {*} client - The Discord.JS Client
 * @param {*} message - The Discord.JS Message that triggers the command
 * @returns Object including the [guild, author, prefix, jeffrey_role, admin_role, mod_role, staff_role, executionInfo] variables
 */
const Initialize = async function(client, message){
  // Variables
  const guild = message.guild;
  const author = message.author;
  const member = message.member;
  const prefix = Config.prefix;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(client.user.id === Config.testingJBID){
      jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
      adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
      modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
      staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  const executionInfo = {
    client: client,
    guild: guild,
    author: author,
    message: message,
    member: message.member
  }

  return {
    guild: guild,
    author: author,
    member: member,
    prefix: prefix,
    jeffrey_role: jeffreyRole,
    admin_role: adminRole,
    mod_role: modRole,
    staff_role: staffRole,
    executionInfo: executionInfo
  };
}

/**
 * Creation of the principal help embed of a command, or the verification of the parameters given by the user.
 * @param {Object[]} commandTree - The configuration for the command, including the parameters if it has.
 * @param {Object[]} executionInfo The information of the execution of the command.
 * - guild
 * - author
 * - member
 * - message
 * @param {Array} [args=null] - The arguments of the user by using the command
 * @returns Embed, or an error if any required parameter is missing
 */
const TutorialEmbed = async function(commandTree, executionInfo, args){
  args = args || null;

  const { client, guild, message, member } = executionInfo;
  let { userlevel, params } = commandTree;

  let originalParams = params;

  let response = [];
  
  // Revisar permisos
  const { jeffrey_role, admin_role, staff_role } = await Initialize(client, message);
  let permissions_role_id; // id del rol a
  switch(userlevel){
    case "DEVELOPER":
      permissions_role_id = jeffrey_role.id;
      break;

    case "ADMIN":
      permissions_role_id = admin_role.id;
      break;

    case "STAFF":
      permissions_role_id = staff_role.id;
      break;

    default:
      permissions_role_id = null;
      break;
  }

  if(permissions_role_id && !member.roles.cache.find(x => x.id === permissions_role_id) && !member.roles.cache.find(x => x.id === jeffrey_role.id)) response = ["ERROR", `INSUFFICIENT PERMISSIONS '${userlevel}'`];

  if(!params) return response;

  let Embed = await createEmbedWithParams(commandTree, guild, params)

  if(!args){ // no se dan args, se creó el embed
    return Embed;
  } else if(args && response.length === 0){ // si hay args llamando con la función, y no hay error de permisos

    // cargar nuevos parametros en caso de ser necesario
    let newParams = [];
    paramsLoop:
    for (let i = 0; i < originalParams.length; i++) {
      const param = originalParams[i];
      
      newParams.push(param)
    
      if(param.type === "Options"){
        break paramsLoop;
      }
    }

    // definir los parámetros que ya fueron escogidos
    let alreadyPassed = "";

    for (let i = 0; i < newParams.length; i++) {
      alreadyPassed += `${args[i]} `;
    }

    let futureParams = false;
    
    // agregar los nuevos parámetros en caso de tener active_on de lo que ya se pasó antes
    let index = originalParams.findIndex(element => element.type === "Options");
    originalParams.forEach(async p => {
      if(p.active_on && p.active_on.param === originalParams[index].name && p.active_on.is === args[index]) {
        // revisar que no esté repetido
        
        futureParams = true;

        newParams.push(p);

        params = newParams;
      }
    })

    if(!futureParams){
      originalParams.forEach(p => {
        let isOnParams = newParams.find(x => x.name === p.name) ? true : false;
        if(!p.active_on && !isOnParams) newParams.push(p);
      });

      params = newParams;

      Embed = await createEmbedWithParams(commandTree, guild, params);
    } else {
      Embed = await createEmbedWithParams(commandTree, guild, params, alreadyPassed);
    }

    verificationLoop:
    for (let i = 0; i < params.length; i++) {
      let param = params[i];
      const arg = args[i] ? args[i] : null;

      let toReturn;
      if(!arg && param.type != "Attachment"){ // null, revisar que sea opcional
        if(param && !param.optional) { // no es opcional, regresar error
          response = ["ERROR", `in ${i} - REQUIRED PARAMETER NOT DEFINED`, i, " "];
          break verificationLoop;
        } else {
          toReturn = null;
        }
      } else {
        // validar el tipo de parámetro dado

        toReturn = await switchParams(param, arg, args, message, guild, member, client, i);

        let joinStringExists = params.find(x => x.type === "JoinString");

        let nothingElseAfterJoinString = params[params.findIndex(x => x === joinStringExists) + 2] ? false : true;
        if(!nothingElseAfterJoinString && joinStringExists) toReturn = "FATAL JOINSTRING";

        if(params[params.findIndex(x => x === joinStringExists) + 1] && nothingElseAfterJoinString){ // esto para cuando haya una solo cosa después de JoinString
          if(joinStringExists && param.type === "JoinString"){
            let indexOfJoinString = params.findIndex(x => x === joinStringExists); // el index del param del JoinString

            let indexFTR = indexOfJoinString + 1 - params.length + args.length; // el index del primer elemento que se SUPONE va justo después del JoinString

            let isValid = await validateAnArg(params[params.findIndex(x => x === joinStringExists) + 1], args[indexFTR], args, message, guild, member, client, i);

            let afterArgs = args.slice(indexFTR, args.length); // el array de lo que está después del JoinString

            // cambiar el "args"
            args = args.slice(0, indexFTR - 1); // actualizar el args, para que no sobren args, el arg que queda en la posicion del JoinString NO son los args juntados.

            if(isValid){ // el arg después de JoinString es valido de acuerdo a los que están en los params.
              afterArgs.forEach(after => {
                toReturn = toReturn.replace(after, "").trimEnd(); // eliminar del toReturn del JoinString cada elemento de afterArgs
                args.push(after); // push al args actualizado
              })
            }
          }
        }


        if(!toReturn){
          const limit = 30;
          let given = arg;
          if(arg && arg.length > limit){
            given = arg.slice(0, limit+1) + "..."
          } else {
            given = " ";
          }
          response = ["ERROR", `in ${i} - INVALID PARAMETER GIVEN`, i, given];
          break verificationLoop;
        } else if(toReturn === "FATAL"){
          response = ["ERROR", `in ${i} - INVALID PARAMETER TYPE`, `UNKOWN ${param.type}`, "FATAL ERROR"];
          break verificationLoop;
        } else if(toReturn === "FATAL JOINSTRING"){
          response = ["ERROR", `in ${i} - INVALID PARAMETERS WRITTEN`, `ONLY ONE PARAM AFTER JOINSTRING`, "FATAL ERROR"];
          break verificationLoop;
        }
      }

      response.push({
        "param": param.name,
        "data": toReturn
      });
      
    }

    if(response[3] === "FATAL ERROR"){
      message.channel.send(`¡${jeffrey_role}, ayuda por aquí!\n\n${member} espera un momento que Jeffrey es un poco lento en las computadoras y tiene que revisar algo para que todo funcione bien.\n\`\`\`json\n${response}\`\`\``);
      return response;
    } else

    if(response[0] === "ERROR") {
      Embed.setAuthor(`Error ▸ ${Config.prefix}${commandTree.name}: ${params[response[2]].name}, invalid "${response[3]}"`, guild.iconURL())
      Embed.setColor(Colores.rojo);
      message.channel.send({embeds: [Embed]}); // Si la response está mal, enviar embed (wip)
      return response;
    } else { // no hay ningún parámetro mal
      return response;
    }
  } else { // si hay un error de permisos
    return response;
  }
  
}

/**
 * 
 * @param {String} toConfirm What is trying to be confirmed
 * @param {Array} dataToConfirm The text that will apear on the embed separated by "▸"
 * @param {*} msg The Discord.JS Message that triggers the command
 * @returns {Promise} Discord.JS Message if the confirmation is positive, if not, returns false
 */
const Confirmation = async function(toConfirm, dataToConfirm, msg){
  let DescriptionString = "";

  dataToConfirm.forEach(data => {
    DescriptionString += `\`▸\` ${data}\n`;
  });

  let confirmation = new Discord.MessageEmbed()
  .setAuthor(`${toConfirm}?`, msg.guild.iconURL())
  .setDescription(DescriptionString)
  .setColor(Colores.rojo);

  let cancelEmbed = new Discord.MessageEmbed()
  .setDescription(`Cancelado.`)
  .setColor(Colores.nocolor);

  let message = await msg.channel.send({embeds: [confirmation]}); // enviar mensaje de confirmación

  // reaccionar
  await message.react(":allow:558084462232076312");
  await message.react(":denegar:558084461686947891");

  return new Promise(async (resolve, reject) => {
    const yesFilter = (reaction, user) => reaction.emoji.id === "558084462232076312" && user.id === msg.author.id;
    const noFilter = (reaction, user) => reaction.emoji.id === "558084461686947891" && user.id === msg.author.id;
    const collectorFilter = (reaction, user) => (reaction.emoji.id === "558084462232076312" || reaction.emoji.id === "558084461686947891") && user.id === msg.author.id;
  
    const yes = message.createReactionCollector({ filter: yesFilter, time: 60000 });
    const no = message.createReactionCollector({ filter: noFilter, time: 60000 });
    const collector = message.createReactionCollector({ filter: collectorFilter, time: 60000 });
  
    collector.on("collect", r => {
      collector.stop();
    });
  
    collector.on("end", async r => {
      if(!(r.size > 0 && (r.size === 1 && r.first().me))) {
        let finalmsg = await message.edit({embeds: [cancelEmbed]});
    
        await message.reactions.removeAll();
    
        await message.react("795090708478033950");
        msg.delete();
        
        setTimeout(() => {
          finalmsg.delete()
        }, ms("20s"));
    
        resolve(false);
      }
    });
  
    yes.on("collect", async r => {
      confirmation
      .setColor(Colores.verde)
      .setAuthor(`${toConfirm}, continuando...`, Config.loadingGif);

      await message.edit({embeds: [confirmation]})
      
      await message.reactions.removeAll();
      resolve(message);
    });
  
    no.on("collect", async r => {
      resolve(false);

      let finalmsg = await message.edit({embeds: [cancelEmbed]})
      
      await message.reactions.removeAll();
      await msg.delete();
      setTimeout(() => {
        finalmsg.delete()
      }, ms("20s"));
    });
  });
}

/**
 * 
 * @param {*} user Mongoose User Query with one document
 * @param {Array} data Needed member, rule string, and proof object used for the infraction
 * @param {Boolean} [isSoftwarn=false] The infraction is a softwarn?
 */
const AfterInfraction = async function(user, data, isSoftwarn){
  isSoftwarn = isSoftwarn || false;
  const { member, rule, proof, message, id } = data;
  const { prefix } = Config;

  if(!isSoftwarn){ // es un warn normal
    const warns = user.warns;
    const totalWarns = warns.length;

    const guild = member.guild;
    
    // acciones de automod
    let arrayEmbeds = [];
    
    let warnedEmbed = new Discord.MessageEmbed()
    .setAuthor(`Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
    .setDescription(`
**—** Has sido __warneado__ por el STAFF.
**—** Warns actuales: **${totalWarns}**.
**—** Por infringir la regla: **${rule}**.
**—** **[Pruebas](${proof.url})**.
**—** ID de Warn: \`${id}\`.`)
    .setColor(Colores.rojo)
    .setFooter(`Ten más cuidado la próxima vez!`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');

    arrayEmbeds.push(warnedEmbed);
    let banMember = false;

    if(totalWarns >= 4){
      let autoMod = new Discord.MessageEmbed()
      .setAuthor(`Ban PERMANENTE.`, "https://cdn.discordapp.com/emojis/537804262600867860.png")
      .setDescription(`**—** PERMABAN.
**—** Warns actuales: **${totalWarns}**.
**—** Razón de ban (AutoMod): Muchos warns.
**—** Último warn por infringir la regla: **${rule}**.`)
      .setColor(Colores.rojo);

      arrayEmbeds.push(autoMod);
      banMember = true;
    } else

    if(totalWarns >= 3){
      let autoMod = new Discord.MessageEmbed()
      .setAuthor(`TempBan`, "https://cdn.discordapp.com/emojis/537792425129672704.png")
      .setDescription(`**—** Ban (24h).
**—** Warns actuales: **${totalWarns}**.
**—** Razón de ban (AutoMod): 3 warns acumulados.
**—** Último warn por infringir la regla: **${rule}**.`)
      .setColor(Colores.rojo);

      arrayEmbeds.push(autoMod);
      banMember = true
      

      GlobalData.findOne({
        "info.type": "temporalGuildBan",
        "info.userID": member.id,
        "info.serverID": guild.id
      }, (err, guildBan) => {
        if(err) throw err;

        let now = new Date();

        if(!guildBan){
          const newBan = new GlobalData({
            info: {
              type: "temporalGuildBan",
              userID: member.id,
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
          guild.unban(member.id)
        }, ms("1d"));
      });
    } else

    if(totalWarns >= 2){
      let infoEmbed = new Discord.MessageEmbed()
      .setAuthor(`Información`, "https://cdn.discordapp.com/emojis/494267320097570837.png?v=1")
    .setDescription(`**—** ${member.user.tag}, este es tu **warn número ❛ \`2\` ❜**
*— ¿Qué impacto tendrá este warn?*
**—** Tranquil@. Este warn no afectará en nada tu estadía en el servidor, sin embargo; el siguiente warn será un **ban de un día**.
**—** Te sugiero comprar un **-1 Warn** en la tienda del servidor. *( \`${prefix}shop\` para más info de precios, etc. )*`)
    .setColor(Colores.rojo);
      
      arrayEmbeds.push(infoEmbed);
    }

    // mensaje de warn normal
    // embed que se le envía al usuario por el warn
    
    await member.send({embeds: arrayEmbeds})
    .catch(e => {
      console.log(e);
      message.react("494267320097570837");
      message.channel.send("¡Usuario con MDs desactivados // Usuario no encontrado! **¡No sabe cuántos WARNS tiene!**");
    });

    if(banMember) console.log("Te baneo");//member.ban({reason: `AutoMod. (Infringir "${rule}")`});
  } else {
    const { member, rule, proof } = data;

    let warnedEmbed = new Discord.MessageEmbed()
    .setAuthor(`¡Cuidado! (Softwarn)`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
    .setDescription(`
**—** Esto es sólo un llamado de atención.
**—** Por infringir la regla: **${rule}**.
**—** [Pruebas](${proof.url})`)
    .setColor(Colores.rojo)
    .setFooter(`Si vuelves a cometer esta misma falla serás warneado, ten cuidado.`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
    
    member.send({embeds: [warnedEmbed]})
    .catch(e => {
      message.react("494267320097570837");
      message.channel.send("¡Usuario con MDs desactivados // Usuario no encontrado! **¡No sabe cuántos WARNS tiene!**");
    });
  }
}

/**
 * 
 * @param {String} guildId The Guild#id
 * @param {Object} message The Discord.JS Message
 * @param {Number} [itemsPerPage = 3] The number of items that will be per page
 * @param {Boolean} isDarkShop If the pages to generate are from the darkshop or not
 * @returns {Array|null} Each element of the array will be the description of the page or null if items do not exist
 */
const GeneratePages = async function(guildId, message, itemsPerPage, isDarkShop){
  itemsPerPage = itemsPerPage || 3;
  isDarkShop = isDarkShop || false;

  const user = await User.findOne({
    user_id: message.author.id,
    guild_id: guildId
  });

  const interest_txt = "Al comprar este item, su precio subirá";
  const viewExtension = "ꜝ";

  const shop = isDarkShop ? await DarkShop.findOne({guild_id: guildId}) : await Shop.findOne({guild_id: guildId});
  const emote = isDarkShop ? Emojis.Dark : Emojis.Jeffros;

  if(!shop || shop.items.length === 0) return null;

  const items = shop.items;

  let pag_actual = 1;
  let totalpags = shop.items.length / itemsPerPage; 

  let inicio = itemsPerPage * pag_actual - itemsPerPage; // el index del primer item a mostrar
  let fin = itemsPerPage * pag_actual - 1; // el index del ultimo item a mostrar

  if(items.length <= fin){
    fin = items.length - 1;
  }

  let pags = [];
  let actualpage = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if(i > fin) { // ayuda no se como hace varias paginas
      pags.push(actualpage);

      actualpage = [];
      pag_actual++;
      fin = itemsPerPage * pag_actual - 1;

      if(items.length <= fin){
        fin = items.length - 1;
      }
    }
    
    const userIsOnMobible = await isOnMobible(message);

    const precio = await DeterminePrice(user, item, true, isDarkShop);
    const nombre = item.name;
    const desc = item.description;
    const id = item.id;
    const interest = item.interest.toLocaleString("es-CO");
    const hasInterest = item.interest != 0 ? true : false;
    const isSub = item.use_info.isSub;

    if(isSub){
      actualpage.push(`**— { ${id} } ${nombre}**\n\`▸\` ${desc}\n▸ ${emote}${precio} **/${prettyMilliseconds(item.use_info.duration)}**\n\n`);
    } else {
      if(userIsOnMobible && hasInterest){
        actualpage.push(`**— { ${id} } ${nombre}**\n\`▸\` ${desc}\n▸ ${emote}${precio}\n\`▸\` ${interest_txt} (+${interest})\n\n`);
      } else if(!userIsOnMobible && hasInterest){ // esta en pc, y el item tiene interés
        actualpage.push(`**— { ${id} } ${nombre}**\n\`▸\` ${desc}\n▸ ${emote}${precio} [${viewExtension}](${message.url} '${interest_txt} (+${interest})')\n\n`);
      } else { // no tiene interés
        actualpage.push(`**— { ${id} } ${nombre}**\n\`▸\` ${desc}\n▸ ${emote}${precio}\n\n`);
      }
    }
  }

  pags.push(actualpage);

  return pags || null;
}

const InteractivePages = async function(message, msg, pages, base){
  if(pages.length === 1) return null;
  let pagn = 0;
  await msg.react("⏪");
  await msg.react("⏩");

  let totalitems = 0;
  pages.forEach(arr => {
    totalitems += arr.length;
  });

  const backwardsFilter = (reaction, user) => reaction.emoji.name === "⏪" && user.id === message.author.id;
  const forwardsFilter = (reaction, user) =>reaction.emoji.name === "⏩" && user.id === message.author.id;
  const collectorFilterMainPage = (reaction, user) => (reaction.emoji.name === "⏩" || reaction.emoji.name === "⏪") && user.id === message.author.id;

  const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 60000 });
  const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 60000 });
  const collectorMainPage = msg.createReactionCollector({ filter: collectorFilterMainPage, time: 60000 });

  collectorMainPage.on("end", r => {
    return msg.reactions.removeAll()
    .then(() => {
        msg.react("795090708478033950");
    });
  })

  backwards.on("collect", async(r, user) => {
    let reactions = r.message.reactions.cache.find(x => x.emoji.name === "⏪");

    if (pagn === 0) return reactions.users.remove(user.id);;
    pagn--;

    embed = new Discord.MessageEmbed()
    .setAuthor(base.title, base.icon)
    .setColor(base.color ?? Colores.verde)
    .setDescription(`${base.description ? base.description + "\n\n" : ""}${pages[pagn].join(" ")}`)
    .setFooter(base.footer.replace(new RegExp("{ACTUAL}", "g"), `${pagn+1}`).replace(new RegExp("{TOTAL}", "g"), `${pages.length}`), base.icon_footer);

    await msg.edit({embeds: [embed]});
    return reactions.users.remove(user.id);
  });

  forwards.on("collect", async(r, user) => {
    let reactions = r.message.reactions.cache.find(x => x.emoji.name === "⏩");

    if (pagn === pages.length - 1) return reactions.users.remove(user.id);;
    pagn++;

    embed = new Discord.MessageEmbed()
    .setAuthor(base.title, base.icon)
    .setColor(base.color ?? Colores.verde)
    .setDescription(`${base.description ? base.description + "\n\n" : ""}${pages[pagn].join(" ")}`)
    .setFooter(base.footer.replace(new RegExp("{ACTUAL}", "g"), `${pagn+1}`).replace(new RegExp("{TOTAL}", "g"), `${pages.length}`), base.icon_footer);

    await msg.edit({embeds: [embed]});
    return reactions.users.remove(user.id);
  });
}

const CollectMessage = async function(message, own_message, custom_filter){
  custom_filter = custom_filter || null;

  if(custom_filter) custom_filter.push("cancel");

  return new Promise(async(resolve, reject) => {
    const filter = custom_filter ? m => m.author.id === message.author.id && custom_filter.find(x => x.toLowerCase() === m.content.toLowerCase()) : m => m.author.id === message.author.id;
    const channel = message.channel;
    const collector = channel.createMessageCollector({ filter, time: ms("1m"), max: 1});

    collector.on("collect", async collected => {
      await collected.delete();
    })
  
    collector.on("end", async collected => {
      let resolvable = collected.size > 0 && collected.first().content.toLowerCase() != "cancel" ? true : false;
      resolve(resolvable ? collected.first() : null);

      if(!resolvable) own_message.edit("Cancelado.");
    });
  })
}

const ValidateParam = async function(type, message){
  const arg = message.content;
  let toReturn;

  switch(type){
    case "Member":
      // buscar por mención, o id
      toReturn = message.mentions.members.first() ? message.mentions.members.first() : message.guild.members.cache.find(x => x.id === arg); 

      if(!toReturn && (arg.toLowerCase() === "yo" || arg.toLowerCase() === "me")){
        toReturn = message.member;
      }

      break;

    case "NotSelfMember":
      // no puede ser el mismo usuario que ejecuta el comando
      let possibleReturn = message.mentions.members.first() ? message.mentions.members.first() : message.guild.members.cache.find(x => x.id === arg);
      toReturn = possibleReturn.id != message.member.id ? possibleReturn : null;
      break;

    case "Role":
      // buscar por mención, o id
      toReturn = message.mentions.roles.first() ? message.mentions.roles.first() : message.guild.roles.cache.find(x => x.id === arg);
      break;

    case "Emoji":
      let isCustom = arg.length > 5 ? true : false;

      if(isCustom){
        let emote = arg.match(/\d/g); // sacando los números del emoji
        emote = emote.join("");
        toReturn = message.guild.emojis.cache.find(x => x.id === emote);
      } else {
        toReturn = arg;
      }
      break;

    case "Channel":
      toReturn = message.mentions.channels.first() ? message.mentions.channels.first() : message.guild.channels.cache.find(x => x.id === arg);
      break;

    case "Message":
      toReturn = await message.channel.messages.fetch(arg);
      break;

    case "MessageLink":
      const linkArray = arg.split("/");
      const numbers = linkArray.filter(element => !isNaN(element) && element.length > 0);

      const actualguild = message.guild;
      const actualchannel = actualguild.channels.cache.find(x => x.id === numbers[1]);
      const actualmessage = await actualchannel.messages.fetch(numbers[2]).catch(err => console.log());
      
      toReturn = actualmessage;
      break;
    
    case "Number":
      if(Number(arg)) toReturn = Number(arg);
      break;

    case "NaturalNumberDiff0":
      if(Math.floor(arg) > 0) {
        toReturn = Math.floor(arg)
      }
      break;

    case "NaturalNumber":
      if(Math.floor(arg) >= 0) {
        toReturn = Math.floor(arg)
      }
      break;

    case "Time":
      toReturn = ms(arg);
      break;

    case "Boolean":
      if(arg === "1" || arg === "true" || arg === "si" || arg === "sí" || arg === "yes" || arg === "y" || arg === "s") toReturn = true;
      else if(arg === "0" || arg === "false" || arg === "no" || arg === "no" || arg === "n") toReturn = false;
      break;

    default:
      toReturn = null;
  }

  return toReturn;
}

/**
 * 
 * @param {*} client The Discord.JS Client
 * @param {String} guildId The Sting of the Guild#id where the commands is executed
 */
const DarkShopWork = async function(client, guildId){
  const maxDaysNormalInflation = Config.daysNormalInflation;
  const maxDaysEventInflation = Config.daysEventInflation;
  const guild = client.guilds.cache.find(x => x.id === guildId);
  
  const dsChannel = client.user.id === Config.testingJBID ? client.channels.cache.find(x => x.id === "790431676970041356") : client.channels.cache.find(x => x.id === Config.dsChannel);
  const dsNews = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "790431614378704906") : guild.roles.cache.find(x => x.id === Config.dsnews);
  const logchannel = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "537095712102416384") : guild.channels.cache.find(x => x.id === Config.logChannel);

  // datas nuevas en caso de necesarias
  const today = new Date();
  
  let inflation = Number(Math.random() * 10 + 1).toFixed(2);
  if(Number(inflation) > 10) inflation = 10;

  const baseDuration = Number(Math.random() * maxDaysNormalInflation).toFixed(1); // duración máxima de inflacion

  // eventos
  const percentage = Math.random() * 100;
  const event = percentage >= 52 ? 0 : percentage >= 14 ? 1 : 2; // 0 baja, 1 sube, 2 igual

  const eventDuration = Number((Math.random() * maxDaysEventInflation) + 1).toFixed(1); // duración máxima de eventos

  const darkshop = await DarkShop.findOne({guild_id: guildId}) ?? await new DarkShop({
    guild_id: guildId,
    inflation: {
      value: inflation,
      since: today,
      duration: Number(baseDuration)
    },
    event: {
      newinflation: await generateNewEventInflation(event),
      since: today,
      count: Number(eventDuration)
    }
  }).save();

  // leer y cambiar inflaciones si es necesario
  // INFLACIÓN NORMAL
  const oldDateInflation = new Date(darkshop.inflation.since);
  
  const pastDaysInflation = await DaysUntilToday(oldDateInflation);
  const actualInflation = darkshop.inflation.value;

  if(pastDaysInflation >= darkshop.inflation.duration){
    darkshop.inflation.old = actualInflation;
    darkshop.inflation.since = today;
    darkshop.inflation.duration = baseDuration;
    darkshop.inflation.value = inflation;

    await darkshop.save();

    console.log("Se ha cambiado la inflación, ahora es", inflation, "|| era:", actualInflation);
  }

  // EVENTOS
  const oldDateEvent = new Date(darkshop.event.since);

  const pastDaysEvent = await DaysUntilToday(oldDateEvent);

  if(pastDaysEvent >= darkshop.event.count){
    console.log("Ahora mismo hay un evento.")
    // enviar mensaje random de evento
    let newInflation = `**${darkshop.event.newinflation}%**`;
    let rndmEventSUBE = [
      `Estamos de suerte, se han devaluado los Jeffros, la inflación ha subido al ${newInflation}`,
      `Los Jeffros se levantaron con pie izquierdo, la inflación sube a ${newInflation}`,
      `Nuestro momento ha llegado, los Jeffros se han devaluado y la inflación sube a ${newInflation}`,
      `Hora de sacar nuestra artillería, han hecho que los Jeffros se devalúen, la inflacion sube a ${newInflation}`,
      `Esto no pasa muy seguido ¿verdad? hoy estamos de suerte, la inflación sube a ${newInflation}`,
      `Bastante espectacular, ¿no? la inflación ha subido a ${newInflation}`
    ];

    let rndmEventBAJA = [
      `Parece que algo en las oficinas ha hecho que la inflación baje al ${newInflation}`,
      `Mira que hay que tener mala suerte, se han regalado miles de Jeffros por todo el planeta y ha hecho que la inflación baje a ${newInflation}`,
      `Al otro lado de la moneda se le dio por fortalecerse, la inflación baja a ${newInflation}`,
      `Han intenado raidearnos, tuvimos que tomar decisiones, la inflación baja a ${newInflation}`,
      `La inflación baja a ${newInflation}. Hay que ver el lado positivo, con suerte nos va mejor para la próxima`,
      `Hay días buenos, y otras veces, sólo hay días. La inflación baja a ${newInflation}`
    ];

    let rndmEventIGUAL = [
      `Por poco... nos han intentado robar en una de nuestras sucursales, la inflación se queda en ${newInflation}`,
      `Parece que casi nos involucran en una mala jugada, la inflación queda en ${newInflation}`,
      `Casi que no lo logramos, pero la inflación queda en ${newInflation}`,
      `Menos mal, la cosa se puso difícil pero logramos hacer que la inflación quedase en ${newInflation}`,
      `¿Qué tal? Casi que nos hacen la jugada, pero somos mejores que ellos. La inflación se queda en ${newInflation}`,
      `Esto es increíble, logramos quedarnos en ${newInflation}, buen trabajo, equipo.`
    ];

    let rSube = rndmEventSUBE[Math.floor(Math.random() * rndmEventSUBE.length)];
    let rBaja = rndmEventBAJA[Math.floor(Math.random() * rndmEventBAJA.length)];
    let rIgual = rndmEventIGUAL[Math.floor(Math.random() * rndmEventIGUAL.length)];

    // revisar si baja, sube o se queda igual de acuerdo a la inflación actual
      
    const oldInflation = Number(darkshop.inflation.value);
    const eventInflation = Number(darkshop.event.newinflation);
    let actualEvent;

    if(eventInflation > oldInflation){
      actualEvent = 1;
    } else if(eventInflation < oldInflation){
      actualEvent = 0;
    } else {
      actualEvent = 2;
    }

    switch(actualEvent){
      case 1:
        let embed = new Discord.MessageEmbed()
        .setAuthor(`Evento`, Config.darkLogoPng)
        .setDescription(rSube)
        .setColor(Colores.negro)
        .setFooter(`La inflación SUBE.`)
        .setTimestamp();

        dsChannel.send({content: `${dsNews}`, embeds: [embed]});
        break;

      case 0:
        let embed2 = new Discord.MessageEmbed()
        .setAuthor(`Evento`, Config.darkLogoPng)
        .setDescription(rBaja)
        .setColor(Colores.negro)
        .setFooter(`La inflación BAJA.`)
        .setTimestamp();

        dsChannel.send({content: `${dsNews}`, embeds: [embed2]});
        break;

      case 2:
        let embed3 = new Discord.MessageEmbed()
        .setAuthor(`Evento`, Config.darkLogoPng)
        .setDescription(rIgual)
        .setColor(Colores.negro)
        .setFooter(`La inflación se MANTIENE.`)
        .setTimestamp();

        dsChannel.send({content: `${dsNews}`, embeds: [embed3]});
        break;
    }

    // aplicar el evento a la inflacion actual
      
    darkshop.inflation.old = oldInflation;
    darkshop.inflation.value = eventInflation;

    await darkshop.save();

    console.log("# Se ha actualizado la inflación debido al evento.")

    // crear de una el nuevo evento
    darkshop.event = {
      newinflation: await generateNewEventInflation(event),
      since: today,
      count: eventDuration
    }

    await darkshop.save();
  }

  // DURACION DE LOS DARKJEFFROS
  const darkusers = await User.find({
    guild_id: guildId,
    "economy.dark.duration": {$gt: 0}
  });

  darkusers.forEach(async darkuser => {
    const darkdata = darkuser.economy.dark;

    const pastDaysDJ = await DaysUntilToday(darkdata.dj_since);

    //console.log("Han pasado %s de %s días de %s", pastDaysDJ, darkdata.duration, darkuser.user_id);

    if(pastDaysDJ >= darkdata.duration){ // ya pasaron los días para cambiar los darkjeffros.
      let memberDJ = guild.members.cache.find(x => x.id === darkuser.user_id);
      
      if(darkdata.darkjeffros === 0){
        let log = new Discord.MessageEmbed()
        .setColor(Colores.verde)
        .setDescription(`**—** Se ha eliminado la Duración de DarkJeffros de ${memberDJ.user.tag}.
**—** Desde: \`${darkdata.dj_since}\`.
**—** Duración: \`${darkdata.duration}\`.`)
        .setFooter("No se ha enviado mensaje al usuario porque sus darkjeffros eran 0.")
        .setTimestamp();
        
        darkdata.dj_since = null;
        darkdata.duration = null;

        await darkuser.save();

        console.log("Se ha eliminado la duración de DJ de", memberDJ.user.tag)
        logchannel.send({embeds: [log]});
      } else {
        let log = new Discord.MessageEmbed()
        .setColor(Colores.verde)
        .setDescription(`**—** Se han eliminado los DarkJeffros de **${memberDJ.user.tag}**.
**—** Desde: \`${darkdata.dj_since}\`.
**—** Duración: \`${darkdata.duration}\`.
**—** Tenía: **${Emojis.Dark}${darkdata.darkjeffros}**`)
        .setFooter("Mensaje enviado a la vez que al usuario")
        .setTimestamp();

        let embed = new Discord.MessageEmbed()
        .setAuthor(`...`, Config.darkLogoPng)
        .setColor(Colores.negro)
        .setDescription(`**—** Parece que no has vendido todos tus DarkJeffros. Han sido eliminados de tu cuenta tras haber concluido los días estipulados. (\`${darkdata.duration} días.\`)`)
        .setFooter("▸ Si crees que se trata de un error, contacta al Staff.");

        darkdata.darkjeffros = 0;
        darkdata.dj_since = null;
        darkdata.duration = null;
        
        await darkuser.save();
        
        console.log("Se ha eliminado la duración de DJ de", memberDJ.user.tag)

        // intentar enviar un mensaje al MD.
        memberDJ.send({embeds: [embed]})
        .catch(err => {
          logchannel.send(`**${memberDJ.user.tag} no recibió MD de DarkJeffros eliminados.**\n\`\`\`javascript\n${err}\`\`\``)
        });

        logchannel.send({embeds: [log]});
      }
    }
  })

  return darkshop;

  async function generateNewEventInflation(event){ // nuevo evento de inflacion en caso de necesitarse
    const oldinflation = darkshop ? darkshop.inflation.value : inflation; // tomar la inflación actual o la que se generó si no existe

    let newinflation;

    if(event === 0){ // baja
      if(oldinflation < 1){
        newinflation = Number(Math.random() * oldinflation).toFixed(2);
      
        let att = 0; // intentos máximos pa que no se muera si la inflacion es muy baja de por si
        while (newinflation < 1 && att < 15) {
          newinflation = Number(Math.random() * (inflation*6)).toFixed(2);
          att++
        }
        
        if(newinflation < 1) newinflation = Number(Math.random() * 10).toFixed(2); // por si el while no es suficiente
        while (newinflation < 1) { // si sigue siendo menor a 1 hallar una inflacion normalmente
          newinflation = Number(Math.random() * 10).toFixed(2);
        }
      } else { // si es mayor a 1 entonces bajar la inflacion, ahora también puede ser menor a 1
        newinflation = Number(Math.random() * oldinflation).toFixed(2);
      }

    } else if(event === 1){ // sube
      newinflation = Number(Math.random() * 10).toFixed(2);

      while(newinflation <= oldinflation){
        newinflation = Number(Math.random() * 10).toFixed(2);
      }

      if(newinflation > 10) newinflation = 10;
    } else { // igual
      newinflation = oldinflation;
    }

    return Number(newinflation);
  }
}

/**
 * 
 * @param {*} user The mongoose User
 * @param {*} author The Discord.JS User
 * @returns 
 */
const ValidateDarkShop = async function(user, author){
  const r = [
    "{you}... No estás listo.",
    "No tienes el valor para hacerlo.",
    "Esto no va a terminar bien para ti, {you}."
  ];

  let res = r[Math.floor(Math.random() * r.length)];

  const desc = res.replace(
      new RegExp("{you}", "g"),
      `**${author.tag}**`
  );

  const notReady = new Discord.MessageEmbed()
  .setColor(Colores.rojo)
  .setDescription(desc)
  .setFooter("▸ Vuelve cuando seas nivel 5.");

  if(user.economy.global.level < 5) return [false, notReady];
  else return [true];
}

const DaysUntilToday = async function(date){
  let hoy = new Date();
  let oldDate = new Date(date); // fecha del dia inicial

  let diference1 = hoy - oldDate

  let response = diference1 / (1000 * 3600 * 24); // dias transcurridos

  if(isNaN(response)) return "?";
  else return Number(response.toFixed(1));
}

/**
 * 
 * @param {*} message The Discord.JS Message
 * @param {*} user The buyer's document inside the database
 * @param {Object} item The object of the item being purchased
 * @param {Boolean} [isDarkShop=false]
 * @returns {Array} Returns [0] true on success, returns [0] false on any error. [1] Is Embed
 */
const ComprarItem = async function(message, user, item, isDarkShop){
  isDarkShop = isDarkShop || false;
  const { prefix } = Config;
  
  const actualJeffros = isDarkShop ? user.economy.dark.darkjeffros : user.economy.global.jeffros;

  // si NaN actualJeffros...
  let doesntDS = new Discord.MessageEmbed()
  .setAuthor(`Error`, Config.errorPng)
  .setDescription(`**—** Aún no tienes una cuenta, cambia unos cuantos Jeffros por DarkJeffros antes de venir a comprar.\n▸ \`${prefix}dschange\`.`)
  .setColor(Colores.rojo);

  if(isNaN(actualJeffros)) return [false, doesntDS];

  const member = message.member;

  // determinar datos generales
  const toPay = await DeterminePrice(user, item, false, isDarkShop);
  const nombre = item.name;
  
  let doesntHaveRole = new Discord.MessageEmbed()
  .setAuthor(`Error`, Config.errorPng)
  .setDescription(`**—** Necesitas el role "<@&${item.req_role}>" para comprar \`${nombre}\`.`)
  .setColor(Colores.rojo);

  let doesntHaveEnough = new Discord.MessageEmbed()
  .setAuthor(`Error`, Config.errorPng)
  .setDescription(`**—** Necesitas **${isDarkShop ? Emojis.Dark : Emojis.Jeffros}${toPay.toLocaleString("es-CO")}** para comprar \`${nombre}\`. Tienes **${isDarkShop ? Emojis.Dark : Emojis.Jeffros}${actualJeffros}**.`)
  .setColor(Colores.rojo);

  let hasRoleToGive = new Discord.MessageEmbed()
  .setAuthor(`Error`, Config.errorPng)
  .setDescription(`**—** Ya tienes el role que te da este item, no puedes comprar \`${nombre}\` otra vez.`)
  .setColor(Colores.rojo);

  // role requerido
  if (item.req_role != "0" && !member.roles.cache.find(x => x.id === item.req_role)) return [false, doesntHaveRole];

  // buscar si ya tiene el role que se da
  if (item.use_info.action === "add" && item.use_info.objetive === "role" && member.roles.cache.find(x => x.id === item.use_info.given)) return [false, hasRoleToGive];

  // buscar el item en el inventario
  const inventoryFilter = x => x.isDarkShop === isDarkShop && x.item_id === item.id;
  if(user.data.inventory.find(inventoryFilter)){

    let hasThisItem = new Discord.MessageEmbed()
    .setAuthor(`Error`, Config.errorPng)
    .setDescription(`**—** Ya tienes \`${nombre}\`, úsalo con \`${prefix}use ${user.data.inventory.find(inventoryFilter).use_id}\`.`)
    .setColor(Colores.rojo);

    return [false, hasThisItem];
  }

  // cobrar
  if(actualJeffros < toPay) return [false, doesntHaveEnough];;
  
  if(isDarkShop) user.economy.dark.darkjeffros -= toPay;
  else user.economy.global.jeffros -= toPay

  // id
  let usos = await User.find();
  let newId = await FindNewId(usos, "data.inventory", "use_id");

  // agregarlo al inventario (Array)
  await user.data.inventory.push({isDarkShop: isDarkShop, item_id: item.id, use_id: newId});
  
  // revisar si debe agregarse interés
  if(item.interest > 0){
    const interestFilter = x => x.isDarkShop === isDarkShop && x.item_id === item.id;
    if(!user.data.purchases.find(interestFilter)) user.data.purchases.push({isDarkShop: isDarkShop, item_id: item.id, quantity: 1});
    else {
      user.data.purchases.find(interestFilter).quantity++;
    }
  }
  
  // guardar y success
  await user.save();

  let success = new Discord.MessageEmbed()
  .setAuthor(`Listo!`, Config.bienPng)
  .setDescription(`\`▸\` Pago realizado con éxito.
\`▸\` Compraste: \`${nombre}\` por **${isDarkShop ? Emojis.Dark : Emojis.Jeffros}${toPay.toLocaleString("es-CO")}**.
\`▸\` **Úsalo con \`${prefix}use ${newId}\`**.
\`▸\` Ahora tienes: **${isDarkShop ? Emojis.Dark : Emojis.Jeffros}${isDarkShop ? user.economy.dark.darkjeffros.toLocaleString("es-CO") : user.economy.global.jeffros.toLocaleString("es-CO")}**.`)
  .setColor(isDarkShop ? Colores.negro : Colores.verde);

  return [true, success];
}

/**
 * 
 * @param {*} user The user's document inside the database
 * @param {*} item The item's object inside the database
 * @param {Boolean} [returnString=false] The function returns an String with the original price and the new one?
 * @param {Boolean} [isDarkShop=false] This is for the DarkShop?
 * @returns {String | Number} Returns a String or a Number in the case
 */
const DeterminePrice = async function(user, item, returnString, isDarkShop){
  isDarkShop = isDarkShop || false;
  returnString = returnString || false;

  const discounts = [
    {
      forDarkShop: false,
      level: 20,
      discount: 15
    }
  ]

  const originalPrice = item.price;
  const user_level = user.economy.global.level;

  // nuevo precio a partir de interés
  const interest = item.interest;
  const searchInterest = x => (x.isDarkShop === isDarkShop) && (x.item_id === item.id);
  const totalpurchases = user.data.purchases.find(searchInterest) ? user.data.purchases.find(searchInterest).quantity : 0;

  const interestPrice = originalPrice + (totalpurchases * interest);
  let precio = interestPrice;

  // descuentos
  let query = discounts.filter(x => user_level >= x.level && x.forDarkShop === isDarkShop).sort(function(a, b){ // ordenar el array mayor a menor, por array.level
    if(a.level > b.level){
      return -1;
    }
    if(a.level < b.level){
      return 1;
    }

    return 0;
  });

  let discounted = false;

  if(query[0]){
    discounted = true;
    precio -= ((precio) / 100) * query[0].discount;
  }
  

  precio = Math.floor(precio) > 0 ? Math.floor(precio) : Math.ceil(precio);

  if(returnString && discounted){
    return `~~${interestPrice.toLocaleString("es-CO")}~~ ${precio.toLocaleString("es-CO")}`;
  } else {
    return precio;
  }
}

const FindNewId = async function(generalQuery, specificQuery, toCheck){
  // id
  let idsNow = []; // ids en uso actualmente
  let newId = 1;

  for (let i = 0; i < generalQuery.length; i++) {
    const document = generalQuery[i];
    
    let forEachLoop = document;
    let split = specificQuery.split(".");

    if(split && split.length >= 1 && split[0].length > 0){
      for (let i = 0; i < split.length; i++) {
          const queryQ = split[i];
          
          forEachLoop = forEachLoop[queryQ]
      }

      forEachLoop.forEach(i => {
        idsNow.push(i[toCheck]); // pushear cada id en uso
      });

    } else {
      idsNow.push(forEachLoop[toCheck])
    }
  }

  while (idsNow.find(x => x === newId)){ // mientras se encuentre la id en las que ya están en uso sumar una hasta que ya no lo esté
    newId++;
  }

  return newId;
}

/**
 * 
 * @param {*} member The Discord.JS Member to check for benefit
 * @param {Array} [objetivesToCheck="[any]"] The objetive of boost to check.
 * - jeffros
 * - exp
 * - all
 * - any
 * @returns {Boolean} This Member already has a temp role with the objetive searched for.
 */
const WillBenefit = async function(member, objetivesToCheck){
  objetivesToCheck = objetivesToCheck ?? ["any"];

  const user = await User.findOne({
    user_id: member.id,
    guild_id: member.guild.id
  });

  const temp_roles = user.data.temp_roles;

  let hasBoost = false;

  temp_roles.forEach(temprole => {
    const special = temprole.special;
    if(special){
      objetivesToCheck.forEach(objetiveToCheck => {
        switch(objetiveToCheck){
          case "jeffros":
          case "exp":
          case "all":
            if(special.objetive === objetiveToCheck) hasBoost = true;
            break;
  
          case "any":
            if(special.objetive === "jeffros" || special.objetive === "exp" || special.objetive === "all") hasBoost = true;
            break;
  
          default:
            hasBoost = false;
            break;
        }
      })
    }
  });

  return hasBoost;
}

async function createEmbedWithParams(commandTree, guild, params, already){
  already = already ?? "";

  let Embed = new Discord.MessageEmbed()
  .setAuthor(`▸ ${Config.prefix}${commandTree.name}`, guild.iconURL())
  .setColor(Colores.nocolor)
  .setFooter("<> Obligatorio () Opcional");

  let DescriptionString = `▸ El uso correcto es: ${Config.prefix}${commandTree.name} ${already}`;
  for (let i = already.split(" ").length - 1; i < params.length; i++) {
    const param = params[i]
    
    if(!param.optional){
      DescriptionString += ` <${param.display ?? param.name}>`
    } else {
      DescriptionString += ` (${param.display ?? param.name})`
    }
  }

  Embed.setDescription(DescriptionString);

  return Embed;
}

async function switchParams(param, arg, args, message, guild, member, client, i){
  let toReturn;
  switch(param.type){
    case "Member":
      // buscar por mención, o id
      toReturn = message.mentions.members.first() ?? guild.members.cache.find(x => x.id === arg); 

      if(!toReturn && (arg.toLowerCase() === "yo" || arg.toLowerCase() === "me")){
        toReturn = message.member;
      }

      break;

    case "Attachment":
      if(message.attachments.size != 0) { // si hay attachements, hacer proof
        toReturn = message.attachments.first();
      }
      break;

    case "NotSelfMember":
      // no puede ser el mismo usuario que ejecuta el comando
      let possibleReturn = message.mentions.members.first() ? message.mentions.members.first() : guild.members.cache.find(x => x.id === arg);
      toReturn = possibleReturn.id != member.id ? possibleReturn : null;
      break;

    case "Role":
      // buscar por mención, o id
      toReturn = message.mentions.roles.first() ? message.mentions.roles.first() : guild.roles.cache.find(x => x.id === arg);
      break;

    case "Emoji":
      let isCustom = arg.length > 5 ? true : false;

      if(isCustom){
        let emote = arg.match(/\d/g); // sacando los números del emoji
        emote = emote.join("");
        toReturn = guild.emojis.cache.find(x => x.id === emote);
      } else {
        toReturn = arg;
      }
      break;

    case "Channel":
      toReturn = message.mentions.channels.first() ? message.mentions.channels.first() : guild.channels.cache.find(x => x.id === arg);
      break;

    case "Message":
      const message_channel = response.find(x => x.param === param.requires_param).data;
      toReturn = await message_channel.messages.fetch(arg);
      break;

    case "MessageLink":
      const linkArray = arg.split("/");
      const numbers = linkArray.filter(element => !isNaN(element) && element.length > 0);

      const actualguild = client.guilds.cache.find(x => x.id === numbers[0]);
      const actualchannel = actualguild.channels.cache.find(x => x.id === numbers[1]);
      const actualmessage = await actualchannel.messages.fetch(numbers[2]).catch(err => console.log());
      
      toReturn = actualmessage;
      break;

    case "Guild":
      if(Number(arg)) toReturn = client.guilds.cache.find(x => x.id === arg);
      break;

    case "String":
      toReturn = arg;
      break;
    
    case "JoinString":
      toReturn = args.join(" ");

      if(i != 0){
        for (let k = 0; k < i; k++) {
          toReturn = toReturn.slice(args[k].length + 1)
        }
      }
      break;

    case "Array":
      toReturn = arg.split(`${param.split}`)
      break;
    
    case "Number":
      if(Number(arg)) toReturn = Number(arg);
      break;

    case "NaturalNumber":
      if(Math.floor(arg) > 0) {
        toReturn = Math.floor(arg)
      }
      break;

    case "NaturalNumberNotInfinity":
      if(Math.floor(arg) > 0 && Number(arg) != Infinity) {
        toReturn = Math.floor(arg)
      }
      break;

    case "Time":
      if(Number(arg) === Infinity) toReturn = Infinity;
      else toReturn = ms(arg);
      break;

    case "Boolean":
      if(arg === "1" || arg === "true" || arg === "si" || arg === "sí" || arg === "yes" || arg === "y" || arg === "s") toReturn = true;
      else if(arg === "0" || arg === "false" || arg === "no" || arg === "no" || arg === "n") toReturn = false;
      break;

    case "Options":
      let possibleOptions = param.options;

      optionsLoop:
      for (let i = 0; i < possibleOptions.length; i++) {
        const option = possibleOptions[i];
        
        if(option === arg){
          toReturn = arg;
          break optionsLoop;
        }
      }
      break;

    default:
      toReturn = "FATAL"
  }

  return toReturn;
}

async function validateAnArg(param, arg, args, message, guild, member, client){
  let toReturn = await switchParams(param, arg, args, message, guild, member, client)

  return toReturn != "FATAL" && toReturn ? true : false;
}

async function isOnMobible(message){
  return message.member.presence && message.member.presence.clientStatus && message.member.presence.clientStatus.mobile === "online" && !message.member.presence.clientStatus.desktop ? true : false;
}

module.exports = {
    getChanges,
    intervalGlobalDatas,
    Warns,
    Interest,
    VaultWork,
    findLvls5,
    LimitedTime,
    Subscription,
    handleUploads,
    Initialize,
    TutorialEmbed,
    Confirmation,
    AfterInfraction,
    GeneratePages,
    CollectMessage,
    ValidateParam,
    InteractivePages,
    DarkShopWork,
    ValidateDarkShop,
    ComprarItem,
    DeterminePrice,
    FindNewId,
    DaysUntilToday,
    WillBenefit
}
