const User = require("../modelos/User.model.js");
const Config = require("../src/resources/base.json");

const { jeffrosExpCooldown } = require("../index.js");

module.exports = async (client, message) => {
    const author = message.author;

    if (jeffrosExpCooldown.has(author.id)) {
      let q = await User.findOne({
        user_id: author.id,
        guild_id: message.guild.id
      });
  
      if(!q) return;
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