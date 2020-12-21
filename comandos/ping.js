const Config = require("./../base.json");
const Discord = require("discord.js");
let prefix = Config.prefix;

module.exports.run = async (bot, message, args) => {

      if(!message.content.startsWith(prefix))return;

      let start = Date.now(); message.reply('Pong! ').then(message => {
      let diff = (Date.now() - start);
      let API = (bot.ws.ping).toFixed(2)

          let embed = new Discord.MessageEmbed()
          .setTitle(`🔔 Pong!`)
          .addField("📶 Ping", `${diff}ms`)
          .addField("💻 API", `${API}ms`)
          
          switch(true){
            case diff >= 180:
              embed.setColor("#ff2f2f")
              break;
              
            case diff >= 120: 
              embed.setColor("#ffa12f")
              break;
              
            default:
              embed.setColor("#2fff3d")
          }
          
          message.edit({content: "", embed: embed});
        });

}

module.exports.help = {
    name: "ping"
}
