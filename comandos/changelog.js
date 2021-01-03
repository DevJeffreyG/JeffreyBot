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
  .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.**\n`)
  .setColor(Colores.verde);
  
  let addCounter = 0;
  let removeCounter = 0;
  let updateCounter = 0;

  for(let i = 0; i < changes.length; i++){
    let addToDesc;

    // regex
    let str = changes[i].desc;
    let desc = str.replace(
      new RegExp("{ PREFIX }", "g"),
      `${prefix}`
    );

    switch(changes[i].type){
      case "added":
        if(addCounter == 0){
          addToDesc = `\n**• Agregado**\n${added} ${desc}.\n`;
        } else {
          addToDesc = `${added} ${desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        addCounter++;
        break;

      case "updated":
        if(updateCounter == 0){
          addToDesc = `\n**• Actualizado**\n${updated} ${desc}.\n`;
        } else {
          addToDesc = `${updated} ${desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        updateCounter++;
        break;

      case "removed":
        if(removeCounter == 0){
          addToDesc = `\n**• Eliminado**\n${removed} ${desc}.\n`;
        } else {
          addToDesc = `${removed} ${desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        removeCounter++;
        break;
    }
  }
  
  message.channel.send(embed);

}

module.exports.help = {
    name: "changelog",
    alias: "changes"
}
