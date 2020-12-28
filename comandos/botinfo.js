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
  .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.**`)
  .setColor(Colores.verde);

  for(let i = 0; i < changes.length; i++){
    let addToDesc;

    let addCounter = 0;
    let removeCounter = 0;
    let updateCounter = 0;
    switch(changes[i].type){
      case "added":
        if(addCounter == 0){
          addToDesc = `\n\n**• Agregado**\n${added} ${changes[i].desc}.\n`;
        } else {
          addToDesc = `${added} ${changes[i].desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        addCounter++;
        break;

      case "updated":
        if(updateCounter == 0){
          addToDesc = `\n\n**• Actualizado**\n${added} ${changes[i].desc}.\n`;
        } else {
          addToDesc = `${added} ${changes[i].desc}.\n`;
        }
        addToDesc = `${updated} ${changes[i].desc}.\n\n`;
        embed.setDescription(embed.description + addToDesc)
        updateCounter++;
        break;

      case "removed":
        if(removeCounter == 0){
          addToDesc = `\n\n**• Eliminado**\n${removed} ${changes[i].desc}.\n`;
        } else {
          addToDesc = `${removed} ${changes[i].desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        removeCounter++;
        break;
    }
  }
  
  message.channel.send(embed);

}

module.exports.help = {
    name: "botinfo",
    alias: "bot"
}
