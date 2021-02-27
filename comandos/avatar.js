const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  
    let member = guild.member(message.mentions.users.first()) || guild.members.cache.get(args[0]) || guild.member(author.id);
      
    let embed = new Discord.MessageEmbed()
    .setAuthor(`${member.user.tag}`, `${member.user.displayAvatarURL()}`)
    .setImage(`${member.user.avatarURL({format: 'png', dynamic: true, size: 1024 })}`)
    .setColor(Colores.verde);

    return message.channel.send(embed);

}

module.exports.help = {
    name: "avatar",
    alias: "pfp"
}
