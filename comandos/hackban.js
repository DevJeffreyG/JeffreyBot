const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let logC = message.guild.channels.cache.find(x => x.id === Config.logChannel);

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}hackban`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}hackban <ID> (razón) \n▸ Baneas a alguien que no está en el servidor.`)
  .setFooter(`<> Obligatorio () Opcional`);

    if(!args[0]) return message.channel.send(embed);
    
    let bUser = args[0];
    let bRazon = args.join(" ").slice(args[0].length + 1);
  
    if(!args[1]) {bRazon = "Hackban, sin especificar."}

    // Si el usuario no tiene permiso de banear
    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

    let bEmbed = new Discord.MessageEmbed()
  .setAuthor(`| HackBan`, author.displayAvatarURL())
    .setDescription(`
**—** Usuario baneado { ID }: **${bUser}**.
**—** Usuario baneado { @ }: <@${bUser}>
**—** Ban en: **${message.channel}**.
**—** Moderador: **${message.author.username}**.
**—** Tiempo: **${message.createdAt}**.
**—** Razón de ban: **${bRazon}**.
      `)
    .setColor(Colores.rojo);

    message.guild.members.ban(bUser, {reason: bRazon}).then(x => message.react("✅")); // Baneado
    logC.send(bEmbed);

}


module.exports.help = {
    name: "hackban",
    alias: "hban"
}
