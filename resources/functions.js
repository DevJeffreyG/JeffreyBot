const Config = require("../base.json");
const Rainbow = require("./rainbow.json");
const Colores = require("./colores.json");
const Emojis = require("./emojis.json");
const Discord = require("discord.js");
const { Structures } = require('discord.js');
const anyBase = require("any-base");
const prettyms = require("pretty-ms");
const dec2hex = anyBase(anyBase.DEC, anyBase.HEX);
let { client, boostedGeneral, boostedJeffros, boostedExp } = require("../jb.js");

const fs = require("fs");
const ms = require("ms");
var Chance = require("chance");
var chance = new Chance();

const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const logChannel = Config.logChannel;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const mainVip = Config.mainVip;
const botsChannel = Config.botsChannel;
const botsVip = Config.botsVip;
const staffComandos = Config.staffComandos;
const staffChat = Config.staffChat;

// ############################

/* ##### MONGOOSE ######## */

const mongoose = require("mongoose");
mongoose.connect(`${process.env.MONGOCONNECT}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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
const testingGuild = "482989052136652800";

/* ##### MONGOOSE ######## */

const findLvls5 = async function(guild){
  let role = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "791006500973576262") : guild.roles.cache.find(x => x.id === Config.dsRole);
  Exp.find({
    serverID: guild.id
  }, async (err, exps) => {
    if(err) throw err;

    if(!exps) return;

    for(let i = 0; i < exps.length; i++){
      let exp = exps[i];
      let member = guild.members.cache.find(x => x.id === exp.userID);

      if(!member.roles.cache.find(x => x.id === role.id)) await member.roles.add(role);
    }
  })
}

// Turn bot off (destroy), then turn it back on
const resetBot = function (channel) {
  // send channel a message that you're resetting bot [optional]
  channel
    .send("Reseteando...")
    .then(msg => client.destroy())
    .then(() => client.login(process.env.TOKEN))
    .then(() => channel.send("Reviví sin problemas."));
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

const loadBoosts = async function() {
  try {
    await intervalGlobalDatas(true)
  } catch (err) {
    console.log(err);
  }
}

const intervalGlobalDatas = async function(justBoost){
  justBoost = justBoost || false;

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
    guild = client.guild.cache.find(x => x.id === Config.jgServer);
    bdRole = guild.roles.cache.find(x => x.id === Config.bdRole);
    logs = guild.channels.cache.find(x => x.id === Config.logChannel);
    dsNews = guild.roles.cache.find(x => x.id === Config.dsnews);
  }

  // buscar un tipo de boost
  GlobalData.find({
    "info.type": "limitedTimeRole",
    "info.special.type": "boostMultiplier"
  }, (err, boosts) => {
    if(err) throw err;

    if(!boosts) return console.log(boosts);

    for (let i = 0; i < boosts.length; i++){
      let boost = boosts[i];
      let role = guild.roles.cache.find(x => x.id === boost.info.roleID);
      let member = guild.members.cache.find(x => x.id === boost.info.userID);
      let since = boost.info.since;
      let realDuration = boost.info.duration;
      let specialData = boost.info.special;
      let today = new Date();
      /*
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
    */

      if(today - since >= realDuration){
        // sacarle el role
        console.log("ha pasado el tiempo 0001")
        member.roles.remove(role);

        // eliminar global data
        boosts[i].remove();

        // buscar el set y eliminarlo
        if(specialData.specialObjective === "exp"){ // si el boost es de exp
          return new Promise((resolve, reject) => {
            boostedExp.delete(member.id)
            resolve(`${member.user.username} eliminado de boostedExp`);
          })
        } else if(specialData.specialObjective === "jeffros"){ // si el boost de de jeffros
          return new Promise((resolve, reject) => {
            boostedJeffros.delete(member.id)
            resolve(`${member.user.username} eliminado de boostedJeffros`);
          })
        } else if(specialData.specialObjective === "all"){ // si el boost es de todo
          return new Promise((resolve, reject) => {
            boostedGeneral.delete(member.id)
            resolve(`${member.user.username} eliminado de boostedGeneral`);
          })
        }
      } else {
        // es un usuario con un boost comprado, entonces...
        
        if(specialData.specialObjective === "exp"){ // si el boost es de exp
          return new Promise((resolve, reject) => {
            boostedExp.add(member.id)
            resolve(`${member.user.username} agregado a boostedExp`);
          })
        } else if(specialData.specialObjective === "jeffros"){ // si el boost de de jeffros
          return new Promise((resolve, reject) => {
            boostedJeffros.add(member.id)
            resolve(`${member.user.username} agregado a boostedJeffros`);
          })
        } else if(specialData.specialObjective === "all"){ // si el boost es de todo
          return new Promise((resolve, reject) => {
            boostedGeneral.add(member.id)
            resolve(`${member.user.username} agregado a boostedGeneral`);
          })
        } else {
          return new Promise((resolve, reject) => {
            reject("No es ninguno de los boosts predeterminados.")
          })
        }
      }
    }
  })

  if(justBoost === true) return;

  // buscar sub
  GlobalData.find({
    "info.type": "jeffrosSubscription"
  }, (err, subs) => {
    if(err) throw err;

    if (!subs) return;

    for(let i = 0; i < subs.length; i++){
      let sub = subs[i]
      let role = guild.roles.cache.find(x => x.id === sub.info.roleID);
      let member = guild.members.cache.find(x => x.id === sub.info.userID);
      let since = sub.info.since;
      let interval = sub.info.interval;
      let price = Number(sub.info.price);
      let subName = sub.info.subName;
      let isCancelled = sub.info.isCancelled;
      let today = new Date();

      let notEnough = new Discord.MessageEmbed()
      .setAuthor(`| Error`, Config.errorPng)
      .setDescription(`**—** No tienes suficientes Jeffros **(${Emojis.Jeffros}${price})** para pagar la suscripción a \`${subName}\`.
      **—** Tu saldo ha quedado en **alerta roja**.`)
      .setColor(Colores.rojo);

      if(today - since >= interval){
        // si fue cancelada ya
        if(isCancelled){
            member.roles.remove(role);
            return subs[i].remove();
        }

        // cobrar jeffros
        Jeffros.findOne({
          serverID: guild.id,
          userID: sub.info.userID
        }, (err, jeffros) => {
          if(err) throw err;

          let paidEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Pagado`, Config.bienPng)
          .setDescription(`**—** Has pagado **${Emojis.Jeffros}${price}** para pagar la suscripción a \`${subName}\`.
          **—** Tu saldo ha quedado en **${Emojis.Jeffros}${jeffros.jeffros - price}**.`)
          .setColor(Colores.verde);

          if(!jeffros || jeffros.jeffros < price){
            // quitarle los jeffros, y dejarlo en negativo
            console.log("no tiene suficientes jeffros")
            jeffros.jeffros -= price;
            member.send(notEnough);
            subs[i].remove();
            member.roles.remove(role);
            jeffros.save();
          } else { // cobrar
            jeffros.jeffros -= price;
            jeffros.save();

            // actualizar el globaldata
            subs[i].info.since = today;
            subs[i].markModified("info");
            subs[i].save();

            member.send(paidEmbed);
          }
        })
      } else {
        return;
      }
    }
  })
  // buscar muteados
  GlobalData.find({
    "info.type": "roleDuration"
  }, (err, roled) => {
    if(err) throw err;

    if(!roled) return;

    for (let i = 0; i < roled.length; i++){
      let role = guild.roles.cache.find(x => x.id === roled[i].info.roleID);
      let member = guild.members.cache.find(x => x.id === roled[i].info.userID);
      let since = roled[i].info.since;
      let realDuration = roled[i].info.duration;
      let today = new Date();

      if(today - since >= realDuration){
        // sacarle el role
        member.roles.remove(role);

        // eliminar global data
        return roled[i].remove();
      } else {
        // nada XD
      }
    }
  })

  // inflacion DARKSHOP

  GlobalData.findOne({
    "info.type": "dsInflation"
  }, (err, dark) => {
    if(err) throw err;

    inflation = Number(Math.random() * 10).toFixed(2);
    if(Number(inflation) < 1) inflation = Number(inflation) + 1;
    date = new Date() // hoy
    duration = Math.floor(Math.random() * 30); // duración máxima 30 días.

    if(!dark){
      console.log(inflation, date, duration);

      const newInflation = new GlobalData({
        info: {
          type: "dsInflation",
          oldinflation: 1,
          inflation: inflation,
          since: date,
          duration: duration
        }
      });

      newInflation.save();
    } else {
      // leer y cambiar si es necesario
      let oldDate = new Date(dark.info.since);
      let newDate = new Date()

      let diference1 = newDate.getTime() - oldDate.getTime();
      let pastDays = Math.floor(diference1 / (1000 * 3600 * 24));

      if(pastDays >= dark.info.duration){


        dark.info.oldinflation = dark.info.inflation;
        dark.info.since = date;
        dark.info.duration = duration;
        dark.info.inflation = inflation;

        dark.markModified("info");
        dark.save();
      } else {
        
      }
    }
  })

  // ELIMINAR DARKJEFFROS CADUCADOS
  GlobalData.find({
    "info.type": "dsDJDuration"
  }, (err, dark) => {
    if(err) throw err;

    if(!dark) return;

    for(let i = 0; i < dark.length; i++){
      // variables
      let id = dark[i].info.userID;
      let member = guild.members.cache.find(x => x.id === id);

      let oldDate = new Date(dark[i].info.since);
      let newDate = new Date()

      let diference1 = newDate.getTime() - oldDate.getTime();
      let pastDays = Math.floor(diference1 / (1000 * 3600 * 24));

      // revisar si tiene darkjeffros el usuario
      Stats.findOne({
        userID: id
      }, (err, user) => {
        if(err) throw err;

        if(user.djeffros === 0) return;

        // si tiene darkjeffros, ¿caducaron?
        if(pastDays >= dark[i].info.duration){
          let staffCID = "514124198205980713";
          if(client.user.id === Config.testingJBID){
            staffCID = "537095712102416384";
          }

          let staffC = guild.channels.cache.find(x => x.id === staffCID);
          let memberD = guild.members.cache.find(x => x.id === user.userID);

          let staffEmbed = new Discord.MessageEmbed()
          .setColor(Colores.verde)
          .setDescription(`**—** Se han elimando los Dark Jeffros de ${memberD.tag}.`)
          .addField(`— Desde`, `${dark[i].info.since}`, true)
          .addField(`— Duración`, `${dark[i].info.duration}`, true)
          .setFooter("Mensaje enviado a la vez que al usuario")
          .setTimestamp();

          let embed = new Discord.MessageEmbed()
          .setAuthor(`| ...`, Config.darkLogoPng)
          .setColor(Colores.negro)
          .setDescription(`**—** Parece que no has vendido todos tus DarkJeffros. Han sido eliminados de tu cuenta tras haber concluido los días estipulados. (\`${dark[i].info.duration} días.\`)`)
          .setFooter("▸ Si crees que se trata de un error, contacta al Staff.");

          // eliminarlos de la cuenta (0)
          user.djeffros = 0;
          user.save();
          // intentar enviar un mensaje al MD.
          member.send(embed)
          .catch(err => {
            staffC.send(`**${member.tag} no recibió MD de DarkJeffros eliminados.**\n\`\`\`javascript\n${err}\`\`\``)
          });

          staffCID.send(staffEmbed);
        }
      })

    }
  })

  // CREAR EVENTO EN UN DIA RANDOM EN UN PLAZO DE 30 DIAS
  GlobalData.findOne({
    "info.type": "dsEventRandomInflation"
  }, (err, dark) => {
    if (err) throw err;

    if(!dark){ // si no existe un evento random, crearlo
      let event = "b";
      let ecuation = Math.random()*100;

      if(ecuation >= 80){ // SUBE EL PRECIO (INFLACION) EN EL EVENTO.
        event = "s";
      } else  if(ecuation >= 20){ // BAJA EL PRECIO (INFLACION) EN EL EVENTO. -> EL MÁS PROBABLE A PASAR
        event = "b";
      } else { // SI ES MENOR QUE 20 EL PRECIO NO CAMBIA
        event = "i";
      }

      let eventinflation;
      date = new Date() // hoy
      duration = Math.floor(Math.random() * 30); // duración máxima 30 días.

      if(event === "s"){ // si el precio DEBE subir
        console.log("sube");
        GlobalData.findOne({
          "info.type": "dsInflation"
        }, (err, inflations) => {
          if(err) throw err;

          if(!inflations){
            return console.log("No hay inflaciones");
          } else {
            let oldInflation = Number(inflations.info.inflation);
            eventinflation = Number((Math.random() * 10) + oldInflation).toFixed(2);

            const newData = new GlobalData({
              info: {
                type: "dsEventRandomInflation",
                inflation: eventinflation,
                since: date,
                duration: duration
              }
            });
            newData.save();
          }
        })
      } else if(event === "b"){ // si el precio DEBE bajar
        console.log("baja");
        GlobalData.findOne({
          "info.type": "dsInflation"
        }, (err, inflations) => {
          if(err) throw err;

          if(!inflations){
            return console.log("No hay inflaciones");
          } else {
            let oldInflation = Number(inflations.info.inflation);

            // si es menor a 1

            if(oldInflation < 1) return;
            eventinflation = Number(Math.random() * oldInflation).toFixed(2);
            
            while (eventinflation < 1) {
              eventinflation = Number(Math.random() * oldInflation).toFixed(2);
            }

            const newData = new GlobalData({
              info: {
                type: "dsEventRandomInflation",
                inflation: eventinflation,
                since: date,
                duration: duration
              }
            });
            newData.save();
          }
        })
      } else { // el precio no cambia
        console.log("igual");
        GlobalData.findOne({
          "info.type": "dsInflation"
        }, (err, inflations) => {
          if(err) throw err;

          if(!inflations){
            return console.log("No hay inflaciones");
          } else {
            let oldInflation = Number(inflations.info.inflation);
            eventinflation = Number(oldInflation);

            const newData = new GlobalData({
              info: {
                type: "dsEventRandomInflation",
                inflation: eventinflation,
                since: date,
                duration: duration
              }
            });
            newData.save();
          }
        })
      }
    } else { // si ya existe, leerlo y revisar si ya es momento de cambiarlo
      if(dark.info.inflation === "NaN"){ // error por alguna razón, elimina el evento
        return dark.remove();
      }
      
      let oldDate = new Date(dark.info.since);
      let newDate = new Date()

      let diference1 = newDate.getTime() - oldDate.getTime();
      let pastDays = Math.floor(diference1 / (1000 * 3600 * 24));

      if(pastDays >= dark.info.duration){
        // enviar mensaje random de evento
        let newInflation = `**${dark.info.inflation}%**`;
        let rndmEventSUBE = [
          `Estamos de suerte, se han devaluado los Jeffros, la inflación ha subido al ${newInflation}`
        ];

        let rndmEventBAJA = [
          `Parece que algo en las oficinas ha hecho que la inflación baje al ${newInflation}`
        ];

        let rndmEventIGUAL = [
          `Por poco... nos han intentado robar en una de nuestras sucursales, la inflación se queda en ${newInflation}`
        ];

        let rSube = rndmEventSUBE[Math.floor(Math.random() * rndmEventSUBE.length)];
        let rBaja = rndmEventBAJA[Math.floor(Math.random() * rndmEventBAJA.length)];
        let rIgual = rndmEventIGUAL[Math.floor(Math.random() * rndmEventIGUAL.length)];

        // revisar si baja, sube o se queda igual de acuerdo a la inflación actual

        GlobalData.findOne({
          "info.type": "dsInflation"
        }, (err, inflation) => {
          if(err) throw err;
          
          let oldInflation = inflation.info.inflation;
          let eventInflation = dark.info.inflation;
          let event;

          if(eventInflation > oldInflation){
            event = "s";
          } else if(eventInflation < oldInflation){
            event = "b";
          } else {
            event = "i";
          }

        switch(event){
          case "s":
            let embed = new Discord.MessageEmbed()
            .setAuthor(`| Evento`, Config.darkLogoPng)
            .setDescription(rSube)
            .setColor(Colores.negro)
            .setFooter(`La inflación SUBE.`)
            .setTimestamp();

            dsChannel.send(`${dsNews}`).then(() => {
              dsChannel.send(embed)
            })
            break;

          case "b":
            let embed2 = new Discord.MessageEmbed()
            .setAuthor(`| Evento`, Config.darkLogoPng)
            .setDescription(rBaja)
            .setColor(Colores.negro)
            .setFooter(`La inflación BAJA.`)
            .setTimestamp();

            dsChannel.send(`${dsNews}`).then(() => {
              dsChannel.send(embed2)
            })
            break;

          case "i":
            let embed3 = new Discord.MessageEmbed()
            .setAuthor(`| Evento`, Config.darkLogoPng)
            .setDescription(rIgual)
            .setColor(Colores.negro)
            .setFooter(`La inflación se MANTIENE.`)
            .setTimestamp();

            dsChannel.send(`${dsNews}`).then(() => {
              dsChannel.send(embed3)
            })
            break;
        }

        // aplicar el evento a la inflacion actual
          
          inflation.info.oldinflation = inflation.info.inflation;
          inflation.info.inflation = dark.info.inflation;

          inflation.markModified("info");
          inflation.save();
        })

        // eliminar el evento
        dark.remove();
      }
    }
  });

  // buscar temp bans
  GlobalData.find({
    "info.type": "temporalGuildBan",
    "info.serverID": guild.id
  }, (err, tempBans) => {
    if(err) throw err;

    if(!tempBans) return;

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
        .setAuthor(`| Unban`, guild.iconURL())
        .setDescription(`
      **—** Usuario desbaneado: **${userID}**.
      **—** Razón: **${ban.info.reason}**.
          `)
        .setColor(Colores.verde);

        logs.send(unBEmbed)
      } else {
        // nada XD
      }
    }
  })

  // buscar usuarios de cumpleaños
  GlobalData.find({
    "info.type": "birthdayData"
  }, (err, birthdays) => {
    if(!birthdays) return;

    for (let i = 0; i < birthdays.length; i++){
      let bd = birthdays[i];
      let member = guild.members.cache.find(x => x.id === bd.info.userID);
      let bdDay = bd.info.birthd;
      let bdMonth = bd.info.birthm;
      let isLocked = bd.info.isLocked ? bd.info.isLocked : false;

      if(!isLocked) return console.log("no está bloqueada");
      if(!bdDay || !bdMonth) return console.log("no está configurado totalmente");
      let now = new Date();
      let actualDay = now.getDate();
      let actualMonth = now.getMonth();

      if((actualDay == bdDay) && (actualMonth + 1 == bdMonth)){ // actualMonth + 1 ( 0 = ENERO && 11 = DICIEMBRE )
        // ES EL CUMPLEAÑOS
        if(!member.roles.cache.find(x => x.id === bdRole.id)) return member.roles.add(bdRole);
      } else {
        // revisar si tiene el rol de cumpleaños, entonces quitarselo
        if(member.roles.cache.find(x => x.id === bdRole.id)) return member.roles.remove(bdRole);
      }
    }
  })
  return;
}

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
            victimWarns.warns += cantidad;
            victimWarns.save();
        }
    })
}

const Interest = function (idUse) {
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

const Duration = function(roleDuration, roleID, victimMember){
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
                    return true;
                }
            });
        }, roleDuration);

    } else {
        // es permanente, no hacer nada
        return;
    }
}

const LimitedTime = function(guild, roleID, victimMember, duration, specialType, specialObjective, specialValue){
    let role = guild.roles.cache.find(x => x.id === roleID);
    specialType = specialType || false;
    specialObjective = specialObjective || false;
    specialValue = specialValue || false;
    let hoy = new Date();

    const newData = new GlobalData({
      info: {
        type: "limitedTimeRole",
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

    victimMember.roles.add(role);
    newData.save();

    // timeout, por si pasa el tiempo antes de que el bot pueda reiniciarse
      setTimeout(function(){
        victimMember.roles.remove(role);

        GlobalData.findOneAndDelete({
            "info.type": "limitedTimeRole",
            roleID: roleID,
            userID: victimMember.id
        }, (err, func) => {
            if(err){
                console.log(err);
            } else {
                console.log("Role eliminado automaticamente")
            }
        });
      }, ms(duration));
}

const Subscription = function(guild, roleID, victimMember, intervalTime, jeffrosPerInterval, subscriptionName){
    let role = guild.roles.cache.find(x => x.id === roleID);

    if(intervalTime === "permanent" || intervalTime === "na"){
      // no es una sub
      console.log("no es una sub al parecer")
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
          price: jeffrosPerInterval,
          subName: subscriptionName,
          isCancelled: false
        }
      })

      victimMember.roles.add(role);
      newData.save();
    }
}

const vaultMode = function(hint) {
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

                          message.channel.send(embed).then(msg => {
                            msg.react("⏪").then(r => {
                              msg.react("⏩");

                              const backwardsFilter = (reaction, user) => reaction.emoji.name === "⏪" && user.id === message.author.id;
                              const forwardsFilter = (reaction, user) => reaction.emoji.name === "⏩" && user.id === message.author.id;
                              const collectorFilter = (reaction, user) => reaction.emoji.name === "⏪" || reaction.emoji.name === "⏩" && user.id === message.author.id;

                              const backwards = msg.createReactionCollector(backwardsFilter, { time: 60000 });
                              const forwards = msg.createReactionCollector(forwardsFilter, { time: 60000 });
                              const collector = msg.createReactionCollector(collectorFilter, { time: 60000 });

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
                                msg.edit(embed);
                              });

                              forwards.on("collect", r => {
                                if (pistan === pista.length) return;
                                pistan++;
                                embed.setFooter(
                                  `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
                                );
                                embed.setDescription(pista[pistan - 1].hint);

                                msg.edit(embed);
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
                            .send(r)
                            .then(m => m.delete({ timeout: ms("5s") }));
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

module.exports = {
    resetBot,
    getChanges,
    loadBoosts,
    intervalGlobalDatas,
    Warns,
    Interest,
    Duration,
    vaultMode,
    findLvls5,
    LimitedTime,
    Subscription
}