const Config = require("../base.json");
const Colores = require("../colores.json");
const Emojis = require("../emojis.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;
const logChannel = Config.logChannel;
const version = Config.version;

/* ##### MONGOOSE ######## */

const Toggle = require("../modelos/toggle.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}comando`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}toggle <comando> (alias) \n▸ Cambia entre un comando deshabilitado o no.`)
  .setFooter(`<> Obligatorio () Opcional`);

  if(!args[0]) return message.channel.send(embed);

  let comando = args[0];
  let alias = args[1] || "na";

  Toggle.findOne({
    command: comando
  }, (err, toggle) => {
    if(err) throw err;

    if(!toggle){ // si no hay toggle de este comando activado (existe el documento)
      const newToggle = new Toggle({
        command: comando,
        alias: alias
      });

      newToggle.save();

      let added = new Discord.MessageEmbed()
      .setAuthor(`| Toggled`, Config.bienPng)
      .setDescription(`**—** Se ha agregado el comando \`${prefix}${comando}\`.
**—** Alias \`${prefix}${alias}\`.`)
      .setColor(Colores.verde);

      return message.channel.send(added)
    } else {
      // revisar si se está editando el alias
      if(toggle.alias != alias){ // si el alias en db no es igual al alias en el comando editar
        toggle.alias = alias;

        toggle.save();

        let edited = new Discord.MessageEmbed()
        .setAuthor(`| Editado`, Config.bienPng)
        .setDescription(`**—** Se ha editado el alias del comando \`${prefix}${comando}\`.
**—** Al alias \`${prefix}${alias}\`.`)
        .setColor(Colores.verde);

        return message.channel.send(edited)
      } else { // borrar (desactivar) toggle

        let removed = new Discord.MessageEmbed()
        .setAuthor(`| Eliminado`, Config.bienPng)
        .setDescription(`**—** Se ha eliminado el comando \`${prefix}${comando}\`.
**—** Alias \`${prefix}${toggle.alias}\`.`)
        .setColor(Colores.verde);

        toggle.remove();

        return message.channel.send(removed)
      }
    }
  })
}

module.exports.help = {
    name: "toggle"
}
