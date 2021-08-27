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

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {
  if(!message.content.startsWith(prefix))return;
  if(message.author.id != jeffreygID) return;

  let user_id = args[0] || message.author.id;

  let totalpurchases = await All.find({userID: user_id}); // interés
  let darkstats = await DarkStats.findOne({userID: user_id}); // estadisiticas de darkshop & items de darkshop
  let exp = await Exp.findOne({userID: user_id, serverID: message.guild.id});
  let jeffros = await Jeffros.findOne({userID: user_id, serverID: message.guild.id});
  let purchases = await Purchases.find({userID: user_id}); // inventario de tienda normal
  let softwarns = await SoftWarn.findOne({userID: user_id});
  let warns = await Warn.findOne({userID: user_id});
  let vaults = await WinVault.find({userID: user_id});

  let firstq = await User.findOne({guild_id: message.guild.id, user_id: user_id});
  if(!firstq){
    const newUser = new User({
      guild_id: message.guild.id,
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
  
        finalQuery.data.inventory = toPush;
      }

      if(vaults){ // inventario tienda normal
        let toPush = [];
        for (let i = 0; i < vaults.length; i++) {
          let codeID = Number(vaults[i].codeID);
          
          //console.log(newID)
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
        console.log(darkstats)
        finalQuery.economy.dark.darkjeffros = darkstats.djeffros;
        finalQuery.economy.dark.accuracy = darkstats.accuracy;

        // items
      }

      // guardar todo
      finalQuery.save();
    });
  }

}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

module.exports.help = {
    name: "syncusers"
}
