const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const reglas = require("./../resources/reglas.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  
  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

  // Get the size of an object
  var size = Object.keys(reglas).length;
    
  //errores
  let rulesEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Reglas`, Config.jeffreyguildIcon)
  .setColor(Colores.verde)
  .setDescription(`▸ Las reglas enumeradas que son usadas en comandos como \`${prefix}softwarn\`, \`${prefix}warn\`, o \`${prefix}pardon\`.`)
  //agregar cada regla de la variable de reglas
  for(let i = 1; i <= size; i++){
      rulesEmbed.addField(reglas[i], `N° **${i}**`);
  }

  return message.channel.send({embeds: [rulesEmbed]});

}

module.exports.help = {
    name: "reglas",
    alias: "rules"
}
