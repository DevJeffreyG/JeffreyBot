const Config = require("./../base.json");
const Package = require("./../package.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const changes = Config.changes;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  let added = "<:Plus:792966881350123540>";
  let removed = "<:Minus:792966881530609736>";
  let updated = "<:Update:792966881690648576>";
  
  let embed = new Discord.MessageEmbed()
  .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.**\n\n`)
  .setColor(Colores.verde);

  for(let i = 0; i < changes.length; i++){
    let addToDesc;
    switch(changes[i].type){
      case "added":
        addToDesc = `**• ${changes[i].title}**\n${added} ${changes[i].desc}.`;
        embed.setDescription(embed.description + addToDesc)
        break;

      case "updated":
        addToDesc = `**• ${changes[i].title}**\n${updated} ${changes[i].desc}.`;
        embed.setDescription(embed.description + addToDesc)
        break;

      case "removed":
        addToDesc = `**• ${changes[i].title}**\n${removed} ${changes[i].desc}.`;
        embed.setDescription(embed.description + addToDesc)
        break;
    }
  }
  
  message.channel.send(embed);

}

module.exports.help = {
    name: "botinfo",
    alias: "bot"
}
