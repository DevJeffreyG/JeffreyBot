const Config = require("./../base.json");
const Package = require("./../package.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const changes = Config.changes;

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;
  let viewExtension = "ꜝ";

  let added = "<:Plus:792966881350123540>";
  let removed = "<:Minus:792966881530609736>";
  let updated = "<:Update:792966881690648576>";
  
  let addCounter = 0;
  let removeCounter = 0;
  let updateCounter = 0;
  let presences = message.guild.presences.cache.find(x => x.userID === message.author.id);

  let userIsOnMobible = presences.clientStatus.mobile === "online" && !presences.clientStatus.desktop ? true : false;

  if(args[0] && args[0] === "extended" || userIsOnMobible){
    let embed = new Discord.MessageEmbed()
    .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.\n(ESTO ES DEMASIADO TEXTO, CREO, SUERTE)**\n`)
    .setColor(Colores.verde);
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
            addToDesc = hasExtended ? `\n**• Agregado •**\n${added} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Agregado •**\n${added} ${desc}.\n`;
          } else {
            addToDesc = hasExtended ? `${added} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `${added} ${desc}.\n`;
          }
          embed.setDescription(embed.description + addToDesc)
          addCounter++;
          break;

        case "updated":
          if(updateCounter == 0){
            addToDesc = hasExtended ? `\n**• Actualizado •**\n${updated} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Actualizado •**\n${updated} ${desc}.\n`;
          } else {
            addToDesc = hasExtended ? `${updated} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `${updated} ${desc}.\n`;
          }
          embed.setDescription(embed.description + addToDesc)
          updateCounter++;
          break;

        case "removed":
          if(removeCounter == 0){
            addToDesc = hasExtended ? `\n**• Eliminado •**\n${removed} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Eliminado •**\n${removed} ${desc}.\n`;
          } else {
            addToDesc = hasExtended ? `${removed} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n`: `${removed} ${desc}.\n`;
          }
          embed.setDescription(embed.description + addToDesc)
          removeCounter++;
          break;
      }
    }

    return message.author.send(embed)
    .catch(err => {
      if(userIsOnMobible){
        message.reply("lo siento, detecté que estás en u dispositivo móvil, pero no pude enviar este mensaje a tus MDs porque los tienes desactivados.");
      } else {
        message.reply("lo siento, no pude enviar este mensaje a tus MDs porque los tienes desactivados.");
      }
    });
  }

  let embed = new Discord.MessageEmbed()
  .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.**\n`)
  .setFooter(`* Si estás en PC, poniendo el mouse sobre '${viewExtension}', podrás ver detalles extendidos de los cambios.\n— En móvil usa '${prefix}changelog extended'.`)
  .setColor(Colores.verde);

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
          addToDesc = hasExtended ? `\n**• Agregado •**\n${added} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Agregado •**\n${added} ${desc}.\n`;
        } else {
          addToDesc = hasExtended ? `${added} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `${added} ${desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        addCounter++;
        break;

      case "updated":
        if(updateCounter == 0){
          addToDesc = hasExtended ? `\n**• Actualizado •**\n${updated} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Actualizado •**\n${updated} ${desc}.\n`;
        } else {
          addToDesc = hasExtended ? `${updated} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `${updated} ${desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        updateCounter++;
        break;

      case "removed":
        if(removeCounter == 0){
          addToDesc = hasExtended ? `\n**• Eliminado •**\n${removed} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Eliminado •**\n${removed} ${desc}.\n`;
        } else {
          addToDesc = hasExtended ? `${removed} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n`: `${removed} ${desc}.\n`;
        }
        embed.setDescription(embed.description + addToDesc)
        removeCounter++;
        break;
    }
  }
  
  return message.channel.send(embed);

}

module.exports.help = {
    name: "changelog",
    alias: "changes"
}
