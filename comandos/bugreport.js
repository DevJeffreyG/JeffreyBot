const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const mongoose = require("mongoose");
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
const BugReport = require("../modelos/bugreport.js");

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
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}bugreport`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}bugreport <Bug> \n▸ Reporta un error del bot.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}bug`);
  
  let bug = args.join(" ");
    if(!bug) return message.channel.send(embed);

    Banned.findOne({
      userID: author.id
    }, (err, baneado) => {
      if(err) throw err;

      if(!baneado){
        const reporte = new BugReport({
            _id: mongoose.Types.ObjectId(),
            username: author.username,
            userID: author.id,
            bug: bug,
            serverID: guild.id,
            time: message.createdAt
        });

        reporte.save()
        .then(result => console.log(result))
        .catch(err => console.log(err));

          return message.reply("¡Reporte de bugs guardado en la base de datos, un Moderador revisará el caso!\nGracias por ayudar a mejorar a Jeffrey Bot.");
      } else {
        return message.reply(`¿Te crees muy gracioso eh? Pues resulta que estás baneado de mi base de datos. Pregúntale a Jeffrey por qué ¯\\_(ツ)\_/¯.`);
      }
    })

}

module.exports.help = {
    name: "bugreport",
    alias: "bug"
}
