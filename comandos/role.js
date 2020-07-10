const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = 437668432604037142;
const jgServer = 447797737216278528;
const offtopicChannel = 483009038234157057;
const version = Config.version;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}role`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}role <Nombre del Rol> \n▸ Sacas el ID de un rol por su nombre.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}id`);
    
  let roleName = args.join(" ").slice(0);
  
  if (!args[0]) return message.channel.send(embed);

    const role = message.guild.roles.cache.find(x => x.name === roleName);
    if(!role) return message.reply(`No encontré ese rol, verifica que hayas escrito bien el nombre.`);

    let finalEmbed = new Discord.MessageEmbed()
    .setAuthor(`Role: ${roleName}`, guild.avatarURL)
    .setDescription(`
**—** Nombre del Role: \`${roleName}\`.
**—** ID: \`${role.id}\`.
**—** Role del servidor: ${guild.name}.
    `)
    .setColor(Colores.verde);

    return message.channel.send(finalEmbed);

}

module.exports.help = {
    name: "role",
    alias: "id"
}
