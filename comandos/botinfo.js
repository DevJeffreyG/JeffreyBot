const Config = require("./../base.json");
const Package = require("./../package.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const changes = Config.changes;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  let added;
  let removed;
  let bugfix;
  let updated;
  
  let embed = new Discord.MessageEmbed()
  .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.**`)
  .setColor(Colores.verde);

  for(let i = 0; i < changes.length; i++){
    switch(changes[i].type){
      case "added":
        embed.addField(changes[i].title, changes[i].desc)
        break;

      case "updated":
        embed.addField(changes[i].title, changes[i].desc)
        break;

      case "removed":
        embed.addField(changes[i].title, changes[i].desc)
        break;
    }
  }
  
  message.channel.send(embed);

}

module.exports.help = {
    name: "botinfo",
    alias: "bot"
}
