const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let notInThisGuild = false;
  let guild = message.guild;

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}role`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}role <Nombre del Rol> (guildID)\n▸ Sacas el ID de un rol por su nombre.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}id`);
    
  let posibleGuild = args[args.length-1];
  let roleName = isNaN(args[args.length-1]) ? args.join(" ").slice(0) : args.join(" ").replace(posibleGuild, "").trimEnd();

  if (!args[0]) return message.channel.send({embeds: [embed]});
  if(!isNaN(args[args.length-1])){
      notInThisGuild = true;
      guild = client.guilds.cache.find(x => x.id === args[args.length-1]);
  }
    if(!guild) return message.reply(`No encontré ese server "${notInThisGuild ? args[args.length-1] : message.guild.id}", verifica que hayas escrito bien la id y que me encuentre en ese server.`);

    const role = guild.roles.cache.find(x => x.name === roleName);
    if(!role) return message.reply(`No encontré ese rol, verifica que hayas escrito bien el nombre.`);

    let finalEmbed = new Discord.MessageEmbed()
    .setAuthor(`Role: ${roleName}`, guild.iconURL())
    .setDescription(`
**—** Nombre del Role: \`${roleName}\`.
**—** ID: \`${role.id}\`.
**—** Role del servidor: \`${guild.name}\`.
    `)
    .setColor(Colores.verde);

    return message.channel.send({embeds: [finalEmbed]});

}

module.exports.help = {
    name: "role",
    alias: "id"
}
