const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const ms = require("ms");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  let member = message.member;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}dmuser`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}dmuser (help) <@usuario> <mensaje a enviar por MD> \n▸ Le envio un mensaje directo a X usuario.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}mduser`);
  
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

  if(args[0].toLowerCase() === "help"){
    let help = new Discord.MessageEmbed()
    .setTitle(`Ayuda: ${prefix}dmuser`)
    .setColor(Colores.nocolor)
    .setDescription(`▸ {yo}: Se cambia "{yo}" por tu nombre.\n▸ {user}: Se cambia "{user}" por el usuario al que se le envía el md.`)
    .addField(`Ejemplo:`, `▸ \`/dmuser @JeffreyG {user}, no es necesario que envíes la misma oración dos veces.\`.\n\n▸ JeffreyG#2225, no es necesario que envíes la misma oración dos veces.`)
    .setFooter(`Es NECESARIO usar los corchetes {} para que pueda ser cambiado.`);

    return message.channel.send(help);
  }
  
  let mdMember = guild.member(message.guild.members.cache.get(args[0]) || message.mentions.users.first());
  if(!mdMember) return message.channel.send(embed).then(a => a.delete(ms('30s')));
  
  if(mdMember.user.bot) return;
  
  let mensaje = args.join(" ").slice(args[0].length + 1);
  if(!args[1]) return message.channel.send(embed).then(a => a.delete(ms('30s')));
  
    let str = args.join(" ").slice(args[0].length + 1);
    let yoStr = str.replace(new RegExp('{yo}', "g"), `**${author.tag}**`);
    let finalStr = yoStr.replace(new RegExp('{user}', "g"), `**${mdMember.user.tag}**`);

    let finalEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Hola:`, "https://i.pinimg.com/originals/85/7f/d7/857fd79dfd7bd025e4cbb2169cd46e03.png")
    .setDescription(`${finalStr}`)
    .setFooter("Este es un mensaje directamente del staff del servidor.")
    .setColor(Colores.verde);

    mdMember.send(finalEmbed)
    .then(a => message.react("✅"))
    .catch(e => {
      return message.reply(`Usuario con los MDs desactivados.`).then(a => a.delete(ms('20s')));
    })
  
}

module.exports.help = {
    name: "dmuser",
    alias: "mduser"
}
