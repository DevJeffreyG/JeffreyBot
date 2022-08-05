const Config = require("../src/resources/base.json");
const { Users } = require("mongoose").models;
const { jeffrosExpCooldown } = require("../index.js");

module.exports = async (client, message) => {
    const author = message.author;
    if(!author) return console.log("⚠️ Message Author is not defined ?!");

    let q = await Users.getOrCreate({user_id: author.id, guild_id: message.guild.id});

    if (q.data.cooldowns.jeffros_exp) {
      if(message.channel.id != Config.mainChannel) return; // arreglar esto ############################################
  
      let global = q.economy.global
  
      let nxtLvl = 10 * ((global.level-1) ** 2) + 50 * (global.level-1) + 100; // fórmula de MEE6.
  
      global.jeffros -= q.data.lastExpJeffros.jeffros;
      
  
      if (global.exp - q.data.lastExpJeffros.exp >= nxtLvl) console.log("Subió de nivel");
      else {
        global.exp -= q.data.lastExpJeffros.exp;
      }
  
      await q.save();
  
      console.log(global.jeffros, global.exp, author.username);
    }
}