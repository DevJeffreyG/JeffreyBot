const Config = require("./../base.json");
const Package = require("./../package.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const changes = Config.changes;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;
  let viewExtension = "ꜝ";

  let added = "<:Plus:792966881350123540>";
  let removed = "<:Minus:792966881530609736>";
  let updated = "<:Update:792966881690648576>";
  
  let embed = new Discord.MessageEmbed()
  .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.**\n`)
  .setFooter(`* Si estás en PC, poniendo el mouse sobre '${viewExtension}', podrás ver detalles extendidos de los cambios. — En móvil usa '${prefix}changelog extended'.`)
  .setColor(Colores.verde);
  
  let addCounter = 0;
  let removeCounter = 0;
  let updateCounter = 0;

  for(let i = 0; i < changes.length; i++){
    let addToDesc;
    let hasExtended = true;

    // regex
    let str = changes[i].desc;
    let str2 = changes[i].extended ? changes[i].extended : false;
    let extendedDetails;
    let desc = str.replace(
      new RegExp("{ PREFIX }", "g"),
      `${prefix}`
    );

    if(str2){
      extendedDetails = str2.replace(
        new RegExp("{ PREFIX }", "g"),
        `${prefix}`
      );
    } else {
      hasExtended = false;
    }

    switch(changes[i].type){
      case "added":
        if(addCounter == 0){
          addToDesc = hasExtended ? `\n**• Agregado**\n${added} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Agregado**\n${added} ${desc}.\n`;
        } else {
          addToDesc = hasExtended ? `${added} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `${added} ${desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        addCounter++;
        break;

      case "updated":
        if(updateCounter == 0){
          addToDesc = hasExtended ? `\n**• Actualizado**\n${updated} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Actualizado**\n${updated} ${desc}.\n`;
        } else {
          addToDesc = hasExtended ? `${updated} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `${updated} ${desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        updateCounter++;
        break;

      case "removed":
        if(removeCounter == 0){
          addToDesc = hasExtended ? `\n**• Eliminado**\n${removed} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Eliminado**\n${removed} ${desc}.\n`;
        } else {
          addToDesc = hasExtended ? `${removed} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n`: `${removed} ${desc}.\n`;
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
