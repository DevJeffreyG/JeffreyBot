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
  let uDbBan = args[0];
  let razon = args.join(" ").slice(args[0].length + 1);

  if(author.id != jeffreygID) return message.reply(`Espera, tú no eres Jeffrey.`);

  Banned.findOne({
    userID: uDbBan
  }, (err, baneado) => {
    if(err) throw err;

    if(!baneado){
      if(!razon) return message.reply(`Falta la razón.`)

      const ban = new Banned({
          _id: mongoose.Types.ObjectId(),
          userID: uDbBan,
          razon: razon
      });

      ban.save()
      .then(result => console.log(result))
      .catch(err => console.log(err));

      return message.reply(`Baneado.`);
    }else{
      return message.reply(`Ya está baneado.`)
    }
  })
  
}

module.exports.help = {
    name: "dbBan",
    alias: "banbug"
}
