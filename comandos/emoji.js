const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (bot, message, args) => {
  if(!message.content.startsWith(prefix))return;

  // Variables
  let notInThisGuild = false;
  let guild = message.guild;

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}emoji`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}emoji <Nombre del emoji> (guildID) \n▸ Sacas el ID de un rol por su nombre.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}emote`);
    
  let emojiName = args[0];
  
  if (!args[0]) return message.channel.send(embed);
  if(!isNaN(args[args.length-1])){
      notInThisGuild = true;
      guild = bot.guilds.cache.find(x => x.id === args[args.length-1]);
  }

    if(!guild) return message.reply(`No encontré ese server "${notInThisGuild ? args[args.length-1] : message.guild.id}", verifica que hayas escrito bien la id y que me encuentre en ese server.`);

    const emoji = guild.emojis.cache.find(x => x.name === emojiName);
    if(!emoji) return message.reply(`No encontré ese emoji, verifica que hayas escrito bien el nombre.`);

    let finalEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Emote: ${emojiName}`, emoji.url)
    .setDescription(`
**—** Nombre del Role: \`${emojiName}\`.
**—** ID: \`${emoji.id}\`.
**—** Es animado: \`${emoji.animated ? "Sí" : "No"}\`.
**—** Emoji del server: \`${guild.name}\`.
    `)
    .setColor(Colores.verde);

    return message.channel.send(finalEmbed);

}

module.exports.help = {
    name: "emoji",
    alias: "emote"
}
