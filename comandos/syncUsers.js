const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");
const mongoose = require("mongoose");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;
const logChannel = Config.logChannel;
const changes = Config.changes;
const reglas = require("./../resources/reglas.json");

/* ##### MONGOOSE ######## */

const User = require("../modelos/User.model.js");
const All = require("../modelos/allpurchases.js");
const DarkStats = require("../modelos/darkstats.js");
const Exp = require("../modelos/exp.js");
const Jeffros = require("../modelos/jeffros.js");
const Purchases = require("../modelos/purchased.js");
const SoftWarn = require("../modelos/softwarn.js");
const Warn = require("../modelos/warn.js");
const WinVault = require("../modelos/winVault.js");
const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {
  if(!message.content.startsWith(prefix))return;
  if(message.author.id != jeffreygID) return;

  //let user_id = args[0] || message.author.id;
  const guildID = message.guild.id;

  await message.guild.members.fetch();
  let members = message.guild.members.cache;

  members.forEach(async (member) => {
    let user_id = member.user.id;

    let totalpurchases = await All.find({userID: user_id}); // interés
    let darkstats = await DarkStats.findOne({userID: user_id}); // estadisiticas de darkshop & items de darkshop
    let exp = await Exp.findOne({userID: user_id, serverID: guildID});
    let jeffros = await Jeffros.findOne({userID: user_id, serverID: guildID});
    let purchases = await Purchases.find({userID: user_id}); // inventario de tienda normal
    let softwarns = await SoftWarn.findOne({userID: user_id});
    let warns = await Warn.findOne({userID: user_id});
    let vaults = await WinVault.find({userID: user_id});
    
    let firstq = await User.findOne({guild_id: guildID, user_id: user_id});
    if(!firstq){
      const newUser = new User({
        guild_id: guildID,
        user_id: user_id,
      });

    
      newUser.save()
      .then(async finalQuery => {
        if(warns){
          let warnstotal = warns.warns; // WARNS EN LA CUENTA VIEJA
      
          let toPush = [];
          for (let i = 0; i < warnstotal; i++) {
            // buscar la nueva id
            let users = await User.find();
            //console.log("NUMERO DE USUARIOS EN TOTAL", users.length)
            let newID = 1;
    
            for (let i = 0; i < users.length; i++) {
              const document = users[i];
              //console.log(document.user_id)
    
              // buscar los warns dentro de este usuario
              let uwarns = document.warns;
              
              //console.log("#########", uwarns)
              if(uwarns.length > 0){
                warnsLoop:
                for (let i = 0; i < uwarns.length; i++) {
                  const warn = uwarns[i];
                  let added = toPush.find(x => x.id === newID) ? true : false;
                  
                  if(warn.id != newID && !added) break warnsLoop;
                  else {
                    newID++;
                  }
                }
              } else { // NO TIENE NINGUN WARN EN LA NUEVA CUENTA
                while(toPush.find(x => x.id === newID)){
                  newID++;
                }
              }
            }
            
            //console.log(newID)
            toPush.push({
              rule_id: 0,
              id: newID
            })
          }
    
          finalQuery.warns = toPush;
        }

        if(softwarns){
          let softwarnstotal = softwarns.warns; // WARNS EN LA CUENTA VIEJA
      
          let toPush = [];
          for (let i = 0; i < softwarnstotal.length; i++) {
            let ruleID = getKeyByValue(reglas, softwarns.warns[i].rule)

            let oldNote = softwarns.warns[i].note;

            // buscar la nueva id
            let users = await User.find();
            //console.log("NUMERO DE USUARIOS EN TOTAL", users.length)
            let newID = 1;
    
            for (let i = 0; i < users.length; i++) {
              const document = users[i];
              //console.log(document.user_id)
    
              // buscar los softwarns dentro de este usuario
              let uwarns = document.softwarns;
              
              //console.log("#########", uwarns)
              if(uwarns.length > 0){
                softwarnsLoop:
                for (let i = 0; i < uwarns.length; i++) {
                  const softwarn = uwarns[i];
                  let added = toPush.find(x => x.id === newID) ? true : false;
                  
                  if(softwarn.id != newID && !added) break softwarnsLoop;
                  else {
                    newID++;
                  }
                }
              } else { // NO TIENE NINGUN WARN EN LA NUEVA CUENTA
                while(toPush.find(x => x.id === newID)){
                  newID++;
                }
              }
            }
            
            //console.log(newID)
            toPush.push({
              rule_id: ruleID,
              note: oldNote,
              id: newID
            })
          }
    
          finalQuery.softwarns = toPush;
        }

        if(totalpurchases){ // interes
          let toPush = [];
          for (let i = 0; i < totalpurchases.length; i++) {
            let isDarkShop = totalpurchases[i].isDarkShop;
            let itemID = Number(totalpurchases[i].itemID);
            let timespurchased = totalpurchases[i].quantity;
            
            //console.log(newID)
            toPush.push({
              isDarkShop: isDarkShop,
              item_id: itemID,
              quantity: timespurchased
            })
          }
    
          finalQuery.data.purchases = toPush;
        }

        if(purchases){ // inventario tienda normal
          let toPush = [];
          for (let i = 0; i < purchases.length; i++) {
            let itemID = Number(purchases[i].itemID);
            
            //console.log(newID)
            toPush.push({
              isDarkShop: false,
              item_id: itemID,
              active: false
            })
          }

          if(darkstats && darkstats.items){ // inventario darkshop
            for (let i = 0; i < darkstats.items.length; i++) {
              let darkitemID = darkstats.items[i].id;
              let isActive = darkstats.items[i].active;
              
              toPush.push({
                isDarkShop: true,
                item_id: darkitemID,
                active: isActive
              })
            }
          }

          finalQuery.data.inventory = toPush;
        }

        if(vaults){ // vault
          let toPush = [];
          for (let i = 0; i < vaults.length; i++) {
            let codeID = Number(vaults[i].codeID);
            
            toPush.push({
              code_id: codeID
            })
          }
    
          finalQuery.data.unlockedVaults = toPush;
        }

        if(exp){
          finalQuery.economy.global.exp = exp.exp;
          finalQuery.economy.global.level = exp.level;
          finalQuery.economy.global.reputation = exp.reputacion;
        }

        if(jeffros){
          finalQuery.economy.global.jeffros = jeffros.jeffros;
        }

        if(darkstats){
          // perfil
          finalQuery.economy.dark.darkjeffros = darkstats.djeffros;
          finalQuery.economy.dark.accuracy = darkstats.accuracy;
        }

        // GLOBALDATAS
        // ultimos jeffros y exp
        let last = await GlobalData.findOne({
          "info.type": "lastExpJeffros",
          "info.userID": user_id
        });

        if(last){
          finalQuery.data.lastExpJeffros.exp = last.info.exp;
          finalQuery.data.lastExpJeffros.jeffros = last.info.jeffros;
        }
        
        // cumpleaños
        let bd = await GlobalData.findOne({
          "info.type": "birthdayData",
          "info.userID": user_id
        });

        if(bd){
          finalQuery.data.birthday.day = bd.info.birthd;
          finalQuery.data.birthday.month = bd.info.birthm;
          finalQuery.data.birthday.locked = bd.info.isLocked;
          finalQuery.data.birthday.locked_since = bd.info.lockedSince;
        }

        // duracion de dj
        let djDuration = await GlobalData.findOne({
          "info.type": "dsDJDuration",
          "info.userID": user_id
        });

        if(djDuration){
          finalQuery.economy.dark.duration = djDuration.info.duration;
          finalQuery.economy.dark.dj_since = djDuration.info.since;
        }

        // roles
        let tempRoles = await GlobalData.find({
          "info.type": "roleDuration",
          "info.userID": user_id
        });

        if(tempRoles){
          let toPush = [];
          for (let i = 0; i < tempRoles.length; i++) {
            const temp_role = tempRoles[i];
            
            let role_id = temp_role.info.roleID;
            let active_since = temp_role.info.since;
            let duration = temp_role.info.duration;
            let sType = temp_role.info.special.type;
            let sObjetive = temp_role.info.special.specialObjective;
            let sValue = temp_role.info.special.specialValue;
              
            toPush.push({
              role_id: role_id,
              active_since: active_since,
              duration: duration,
              special: {
                type: sType,
                objetive: sObjetive,
                value: sValue
              }
            })
          }

          // subs
          let subs = await GlobalData.find({
            "info.type": "jeffrosSubscription",
            "info.userID": user_id
          });
          if(subs){
            for (let i = 0; i < subs.length; i++) {
              const sub = subs[i];
              
              let role_id = sub.info.roleID;
              let active_since = sub.info.since;
              let duration = sub.info.interval;
    
              let price = sub.info.price;
              let name = sub.info.subName;
              let cancelled = sub.info.isCancelled;
                
              toPush.push({
                role_id: role_id,
                active_since: active_since,
                duration: duration,
                isSub: true,
                sub_info: {
                  price: price,
                  name: name,
                  isCancelled: cancelled
                }
              });
            }
          }
          
          finalQuery.data.temp_roles = toPush;
        }

        // guardar todo
        await finalQuery.save()
        .catch(err => console.log(err));
      });
    }
  });

  return message.react("✅");
}

function getKeyByValue(object, value) {
  switch (value){ // algunas reglas cambiaron de nombre D:
    case "Problemas personales":
    case "No Contenido NSFW / Comportamiento respetuoso":
      value = "Ambiente sano"
      break;
    
    case "Cadenas de mensajes en el chat":
      value = "Sentido común"
      break;
  }

  return Object.keys(object).find(key => object[key] === value);
}

module.exports.help = {
    name: "syncusers"
}
