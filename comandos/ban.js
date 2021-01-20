const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let logC = message.guild.channels.cache.find(x => x.id === Config.logChannel);

  if(bot.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");

    logC = message.guild.channels.cache.find(x => x.id === "483108734604804107");

  }

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}ban`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}ban <@usuario> (razón) \n▸ Baneas a alguien.`)
  .setFooter(`<> Obligatorio () Opcional`);

  // Si el usuario no tiene permiso de banear
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

    if(!args[0]) return message.channel.send(embed);
    
    let bUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
    let bRazon = args.join(" ").slice(args[0].length + 1);
  
    if(!args[1]) {bRazon = "Sin especificar."}

    // Si el usuario a banear tiene el permiso de banear también
    if(bUser.roles.cache.has(staffRole)) return console.log("NO.");
    if(bUser.id === author.id) return message.reply("Tú eres tonto.");

    let bEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Ban`, author.displayAvatarURL())
    .setDescription(`
**—** Usuario baneado: **${bUser}**.\n\n
**—** Mod: **${message.author.username}**.
      `)
    .setColor(Colores.rojo)
    .setFooter(bRazon)
    .setTimestamp();

    message.guild.members.ban(bUser, {reason: bRazon}).then(x => message.react("✅")); // Baneado
    logC.send(bEmbed);

}


module.exports.help = {
    name: "ban"
}
