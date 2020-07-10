const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
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

const Jeffros = require("../modelos/jeffros.js");
const Reporte = require("../modelos/reporte.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Banned = require("../modelos/banned.js");


/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {
  if (!message.content.startsWith(prefix)) return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  let embed = new Discord.MessageEmbed()
    .setTitle(`Ayuda: ${prefix}8ball`)
    .setColor(Colores.nocolor)
    .setDescription(
      `▸ El uso correcto es: ${prefix}8ball <Pregunta> <Continuar pregunta> (Más...)`
    )
    .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}pregunta`);

  if (!args[1]) return message.channel.send(embed);
  let replies = ["Sí.", "No.", "No lo sé", "Pregunta más tarde."];

  let answer = Math.floor(Math.random() * replies.length);
  let pregunta = args.slice(0).join(" ");

  let pregEmbed = new Discord.MessageEmbed()
    .setColor(Colores.verde)
    .setAuthor(`| ${message.author.tag}`, author.displayAvatarURL())
    .addField("Pregunta", pregunta)
    .addField("Respuesta", replies[answer]);

  message.channel.send(pregEmbed);
};

module.exports.help = {
  name: "8ball",
  alias: "pregunta"
};
