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

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if (!message.member.roles.cache.has(staffRole)) return;
  let member = args[0] || author.id;

  // ¿es nivel 5?
  
  Exp.findOne({
      userID: member
  }, (err, exp) => {
      if(err) throw err;

      if(exp.level >= 5){ // si cumple los requisitos
        let tienda = new Discord.MessageEmbed()
        .setAuthor(`| Darkshop`, author.displayAvatarURL())
        .setColor(Colores.negro)
        .setDescription(`**—** Bienvenido a la DarkShop. \`${prefix}darkshop <ID del item>\`.
**—** Para tener más información del item usa \`${prefix}darkshop info <id>\`.
**—** Esta tienda __**NO**__ usa los Jeffros convencionales, usa \`${prefix}darkshop bal\` para saber tu saldo.`)
        .setFooter(`— Alias: ${prefix}ds`);

        message.channel.send(tienda);
      } else { // si no los cumple
          r = [
              "{you}... No estás listo.",
              "No tienes el valor para hacerlo.",
              "Esto no va a terminar bien para ti, {you}."
          ];

          res = r[Math.floor(Math.random() * r.length)];

          let desc = res.replace(
            new RegExp("{you}", "g"),
            `**${author.tag}**`
          );

          let notReady = new Discord.MessageEmbed()
          .setColor(Colores.rojo)
          .setDescription(desc)
          .setFooter("▸ Vuelve cuando seas nivel 5.");

          return message.channel.send(notReady);
      }
  })

}

module.exports.help = {
    name: "darkshop",
    alias: "ds"
}
