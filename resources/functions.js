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

const moment = require('moment-timezone');
moment().tz("America/Bogota").format();

/* ##### MONGOOSE ######## */

const mongoose = require("mongoose");
mongoose.connect(`${process.env.MONGOCONNECT}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const User = require("../modelos/User.model.js");

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
const { resolve, join } = require("path");

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

    let roles = dbUser && dbUser.data.temp_roles ? true : false;

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
            console.log("ha pasado el tiempo 0001")
            member.roles.remove(role);

            // eliminar el temprole de la db
            dbUser.data.temp_roles.splice(i, 1);
            dbUser.save();
          } else { // es una suscripción
            let price = Number(temprole.sub_info.price);
            let subName = temprole.sub_info.name;
            let isCancelled = temprole.sub_info.isCancelled;

            let notEnough = new Discord.MessageEmbed()
            .setAuthor(`| Error`, Config.errorPng)
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
              .setAuthor(`| Pagado`, Config.bienPng)
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
  // inflacion DARKSHOP

  const maxDaysNormalInflation = Config.daysNormalInflation;
  const maxDaysEventInflation = Config.daysEventInflation;

  GlobalData.findOne({
    "info.type": "dsInflation"
  }, (err, dark) => {
    if(err) throw err;

    inflation = Number(Math.random() * 10).toFixed(2);
    if(Number(inflation) < 1) inflation = Number(inflation) + 1; // no puede ser menor a 1, sólo con los eventos
    date = new Date() // hoy
    duration = Number(Math.random() * maxDaysNormalInflation).toFixed(1); // duración máxima de inflacion

    if(!dark){
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

      console.log("Se ha creado una nueva inflación desde cero.")
    } else {
      // leer y cambiar si es necesario
      let oldDate = new Date(dark.info.since);
      let newDate = new Date()

      let diference1 = newDate.getTime() - oldDate.getTime();
      let pastDays = Math.floor(diference1 / (1000 * 3600 * 24));
      let oldInflation = dark.info.inflation;

      if(pastDays >= dark.info.duration){


        dark.info.oldinflation = dark.info.inflation;
        dark.info.since = date;
        dark.info.duration = duration;
        dark.info.inflation = inflation;

        dark.markModified("info");
        dark.save();

        console.log("Se ha cambiado la inflación, ahora es", inflation, "|| era:", oldInflation);
      }
    }
  })

  // ELIMINAR DARKJEFFROS CADUCADOS
  GlobalData.find({
    "info.type": "dsDJDuration"
  }, async (err, dark) => { // buscar todas las duraciones de darkjeffros
    if(err) throw err;

    if(dark) { // si hay
      let q = await GlobalData.findOne({
        "info.type": "dsInflation"
      });

      for(let i = 0; i < dark.length; i++){
        // variables
        let id = dark[i].info.userID; // id de usuario
        let member = guild.members.cache.find(x => x.id === id); // miembro actual

        let oldDate = new Date(dark[i].info.since);
        let newDate = new Date()
       
        let diference1 = newDate.getTime() - oldDate.getTime();
        let pastDays = Math.floor(diference1 / (1000 * 3600 * 24));

        // revisar si tiene darkjeffros el usuario
        Stats.findOne({
          userID: id
        }, async (err, user) => {
          if(err) throw err;

          if(user.djeffros != 0){
            // si tiene darkjeffros, ¿caducaron?
            if(pastDays >= dark[i].info.duration){
              let staffCID = Config.logChannel;
              if(client.user.id === Config.testingJBID){
                staffCID = "537095712102416384";
              }

              let staffC = guild.channels.cache.find(x => x.id === staffCID);
              let memberD = guild.members.cache.find(x => x.id === user.userID);

              let staffEmbed = new Discord.MessageEmbed()
              .setColor(Colores.verde)
              .setDescription(`**—** Se han elimando los Dark Jeffros de **${memberD.user.tag}**.
              **—** Desde: \`${dark[i].info.since}\`.
              **—** Duración: \`${dark[i].info.duration}\`.
              **—** Tenía: **${Emojis.Dark}${user.djeffros}**`)
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

              // eliminar dsDJDuration
              await dark[i].remove();
              console.log("Se han eliminado los DJ de", memberD.tag)

              // intentar enviar un mensaje al MD.
              member.send({embeds: [embed]})
              .catch(err => {
                staffC.send(`**${member.user.tag} no recibió MD de DarkJeffros eliminados.**\n\`\`\`javascript\n${err}\`\`\``)
              });

              staffC.send({embeds: [staffEmbed]});
            }
          } else { // sus darkjeffros están en 0
            // revisar si caduracion para eliminar el globaldata
            if(pastDays >= dark[i].info.duration){
              let staffCID = Config.logChannel;
              if(client.user.id === Config.testingJBID){
                staffCID = "537095712102416384";
              }

              let staffC = guild.channels.cache.find(x => x.id === staffCID);
              let memberD = guild.members.cache.find(x => x.id === user.userID);

              let staffEmbed = new Discord.MessageEmbed()
              .setColor(Colores.verde)
              .setDescription(`**—** Se ha eliminado la dsDJDuration de ${memberD.user.tag}.
              **—** Desde: \`${dark[i].info.since}\`.
              **—** Duración: \`${dark[i].info.duration}\`.`)
              .setFooter("No se ha enviado mensaje al usuario porque sus darkjeffros eran 0.")
              .setTimestamp();

              // eliminar dsDJDuration
              await dark[i].remove();
              console.log("Se ha eliminado el globaldata de DJ de", memberD.tag)
              staffC.send({embeds: [staffEmbed]});
            }
          }
        })
      }
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

      if(ecuation >= 52){ // BAJA EL PRECIO (INFLACION) EN EL EVENTO. -> EL MÁS PROBABLE A PASAR
        event = "b";
      } else  if(ecuation >= 14){ // SUBE  EL PRECIO (INFLACION) EN EL EVENTO. 
        event = "s";
      } else { // SI ES MENOR QUE 14 EL PRECIO NO CAMBIA
        event = "i";
      }

      let eventinflation;
      date = new Date() // hoy
      duration = Number((Math.random() * maxDaysEventInflation) + 1).toFixed(1); // duración máxima de eventos

      if(event === "s"){ // si el precio DEBE subir
        console.log("Evento próximo va a subir");
        GlobalData.findOne({
          "info.type": "dsInflation"
        }, (err, inflations) => {
          if(err) throw err;

          if(!inflations){
            console.log("No hay inflaciones");
          } else {
            let oldInflation = Number(inflations.info.inflation);
            eventinflation = Number((Math.random() * 10) + oldInflation).toFixed(2);

            if(eventinflation >= 10) eventinflation = 10; // no puede ser mayor a 10

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
        console.log("Evento próximo va a bajar");
        GlobalData.findOne({
          "info.type": "dsInflation"
        }, (err, inflations) => {
          if(err) throw err;

          if(!inflations){
            console.log("No hay inflaciones");
          } else {
            let oldInflation = Number(inflations.info.inflation);

            // si es menor a 1 no bajar más

            if(oldInflation < 1){
              eventinflation = Number(Math.random() * oldInflation).toFixed(2);
            
              let att = 0; // intentos máximos pa que no se muera si la inflacion es muy baja de por si
              while (eventinflation < 1 && att < 15) {
                eventinflation = Number(Math.random() * (inflation*6)).toFixed(2);
                att++
              }
              
              if(eventinflation < 1) eventinflation = Number(Math.random() * 10).toFixed(2);
              while (eventinflation < 1) { // si sigue siendo menor a 1 hallar una inflacion normalmente
                eventinflation = Number(Math.random() * 10).toFixed(2);
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
            } else { // si es mayor a 1 entonces bajar la inflacion, ahora también puede ser menor a 1
              eventinflation = Number(Math.random() * oldInflation).toFixed(2);

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
          }
        })
      } else { // el precio no cambia
        console.log("Evento próximo queda igual la inflación");
        GlobalData.findOne({
          "info.type": "dsInflation"
        }, (err, inflations) => {
          if(err) throw err;

          if(!inflations){
            console.log("No hay inflaciones");
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
    } else { // si ya existe un evento, leerlo y revisar si ya es momento de cambiarlo
      if(dark.info.inflation === "NaN"){ // error por alguna razón, elimina el evento
        dark.remove();
      } else { // si no hay error proseguir
      
        let oldDate = new Date(dark.info.since);
        let newDate = new Date()

        let diference1 = newDate.getTime() - oldDate.getTime();
        let pastDays = Math.floor(diference1 / (1000 * 3600 * 24));

        if(pastDays >= dark.info.duration){
          console.log("Ahora mismo hay un evento.")
          // enviar mensaje random de evento
          let newInflation = `**${dark.info.inflation}%**`;
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

              dsChannel.send({content: `${dsNews}`, embeds: [embed]});
              break;

            case "b":
              let embed2 = new Discord.MessageEmbed()
              .setAuthor(`| Evento`, Config.darkLogoPng)
              .setDescription(rBaja)
              .setColor(Colores.negro)
              .setFooter(`La inflación BAJA.`)
              .setTimestamp();

              dsChannel.send({content: `${dsNews}`, embeds: [embed2]});
              break;

            case "i":
              let embed3 = new Discord.MessageEmbed()
              .setAuthor(`| Evento`, Config.darkLogoPng)
              .setDescription(rIgual)
              .setColor(Colores.negro)
              .setFooter(`La inflación se MANTIENE.`)
              .setTimestamp();

              dsChannel.send({content: `${dsNews}`, embeds: [embed3]});
              break;
          }

          // aplicar el evento a la inflacion actual
            
            inflation.info.oldinflation = inflation.info.inflation;
            inflation.info.inflation = dark.info.inflation;

            inflation.markModified("info");
            inflation.save();

            console.log("# Se ha actualizado la inflación debido al evento.")
          })

          // eliminar el evento
          dark.remove();
        }
      }
    }
  });

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
          .setAuthor(`| Unban`, guild.iconURL())
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
        let isLocked = bd.info.isLocked ? bd.info.isLocked : false;

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
 * @param {(number | string)} duration The duration of the temporary role in ms.
 * - "permanent" for not being an temporary role.
 * @param {string} [specialType=false] The special type of this temporary role.
 * - boostMultiplier
 * @param {string} [specialObjective=false] The objetive for this special type of temporary role.
 * - exp
 * - jeffros
 * - all
 * @param {number} [specialValue=false] The value for the objetive of this special temporary role.
 * @returns void
 */
const LimitedTime = async function(guild, roleID, victimMember, duration, specialType, specialObjective, specialValue){
    specialType = specialType || false;
    specialObjective = specialObjective || false;
    specialValue = specialValue || false;

    let role = guild.roles.cache.find(x => x.id === roleID);

    let user = await User.findOne({
      user_id: victimMember.id,
      guild_id: victimMember.guild.id
    });



    // si no es un boost (por ahora)
    if(!specialType){
      console.log("Nuevo roleDuration que NO es un BOOST.")

      /* "duration" DEBE SER ms ( no se usa ms() ) */
      if(duration != "permanent"){
        // agregar una global data con la fecha

        let hoy = new Date();
        const newData = new GlobalData({
            info: {
                type: "roleDuration",
                roleID: roleID,
                userID: victimMember.id,
                since: hoy,
                duration: duration,
                special: {
                  "type": false,
                  "specialObjective": false, 
                  "specialValue": false
                }
            }
        })

        let toPush = {
          role_id: roleID,
          active_since: hoy,
          duration: duration
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

      } else {
          // es permanente, no hacer nada
          return console.log("Por qué llamas literalmente una función que se llama 'Limited Time' para un role que es permanente? ¿No tienes sentido común o qué?");
      }
    } else { // es un boost

      let hoy = new Date();

      const newData = new GlobalData({
        info: {
          type: "roleDuration",
          roleID: roleID,
          userID: victimMember,
          since: hoy,
          duration: duration,
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
              "info.type": "roleDuration",
              "info.roleID": roleID,
              "info.userID": victimMember.id
          }, (err, func) => {
              if(err){
                  console.log("e2", err);
              } else {
                  console.log("Role eliminado automaticamente")
              }
          });
        }, duration);
    }
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
      if(!arg){ // null, revisar que sea opcional
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
          if(arg.length > limit){
            given = arg.slice(0, limit+1) + "..."
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
  .setAuthor(`| ${toConfirm}?`, msg.guild.iconURL())
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
      .setAuthor(`| ${toConfirm}, continuando...`, Config.loadingGif);

      await message.edit({embeds: [confirmation]})
      
      message.reactions.removeAll();
      resolve(message);
    });
  
    no.on("collect", async r => {
      resolve(false);

      let finalmsg = await message.edit({embeds: [cancelEmbed]})
      
      message.reactions.removeAll();
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
  const { member, rule, proof, message } = data;
  const { prefix } = Config;

  if(!isSoftwarn){ // es un warn normal
    const warns = user.warns;
    const totalWarns = warns.length;

    const guild = member.guild;
    
    // acciones de automod
    let arrayEmbeds = [];
    
    let warnedEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Warn`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
    .setDescription(`
**—** Has sido __warneado__ por el STAFF.
**—** Warns actuales: **${totalWarns}**.
**—** Por infringir la regla: **${rule}**.
**—** **[Pruebas](${proof.url})**.`)
    .setColor(Colores.rojo)
    .setFooter(`Ten más cuidado la próxima vez!`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');

    arrayEmbeds.push(warnedEmbed);
    let banMember = false;

    if(totalWarns >= 4){
      let autoMod = new Discord.MessageEmbed()
      .setAuthor(`| Ban PERMANENTE.`, "https://cdn.discordapp.com/emojis/537804262600867860.png")
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
      .setAuthor(`| TempBan`, "https://cdn.discordapp.com/emojis/537792425129672704.png")
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
      .setAuthor(`| Información`, "https://cdn.discordapp.com/emojis/494267320097570837.png?v=1")
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

async function createEmbedWithParams(commandTree, guild, params, already){
  already = already ? already : "";

  let Embed = new Discord.MessageEmbed()
  .setAuthor(`▸ ${Config.prefix}${commandTree.name}`, guild.iconURL())
  .setColor(Colores.nocolor)
  .setFooter("<> Obligatorio () Opcional");

  let DescriptionString = `▸ El uso correcto es: ${Config.prefix}${commandTree.name} ${already}`;
  for (let i = already.split(" ").length - 1; i < params.length; i++) {
    const param = params[i]
    
    if(!param.optional){
      DescriptionString += ` <${param.display ? param.display : param.name}>`
    } else {
      DescriptionString += ` (${param.display ? param.display : param.name})`
    }
  }

  Embed.setDescription(DescriptionString);

  return Embed;
}

async function switchParams(param, arg, args, message, guild, member, client, i){
  switch(param.type){
    case "Member":
      // buscar por mención, o id
      toReturn = message.mentions.members.first() ? message.mentions.members.first() : guild.members.cache.find(x => x.id === arg); 

      if(!toReturn && (arg.toLowerCase() === "yo" || arg.toLowerCase() === "me")){
        toReturn = message.member;
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

    case "Time":
      toReturn = ms(arg);
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

module.exports = {
    getChanges,
    intervalGlobalDatas,
    Warns,
    Interest,
    vaultMode,
    findLvls5,
    LimitedTime,
    Subscription,
    handleUploads,
    Initialize,
    TutorialEmbed,
    Confirmation,
    AfterInfraction
}