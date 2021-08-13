const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {
  if (!message.content.startsWith(prefix)) return;

  // Variables
  let author = message.author;

  let embed = new Discord.MessageEmbed()
    .setTitle(`Ayuda: ${prefix}8ball`)
    .setColor(Colores.nocolor)
    .setDescription(
      `▸ El uso correcto es: ${prefix}8ball <Pregunta> <Continuar pregunta> (Más...)`
    )
    .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}pregunta`);

  if (!args[1]) return message.channel.send({embeds: [embed]});
  let replies = ["Sí.", "No.", "No lo sé", "Pregunta más tarde."];

  let answer = Math.floor(Math.random() * replies.length);
  let pregunta = args.slice(0).join(" ");

  let pregEmbed = new Discord.MessageEmbed()
    .setColor(Colores.verde)
    .setAuthor(`| ${message.author.tag}`, author.displayAvatarURL())
    .addField("Pregunta", pregunta)
    .addField("Respuesta", replies[answer]);

  message.channel.send({embeds: [pregEmbed]});
};

module.exports.help = {
  name: "8ball",
  alias: "pregunta"
};
