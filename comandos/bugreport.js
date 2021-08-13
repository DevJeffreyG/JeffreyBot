const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const mongoose = require("mongoose");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Banned = require("../modelos/banned.js");
const BugReport = require("../modelos/bugreport.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}bugreport`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}bugreport <Bug> \n▸ Reporta un error del bot.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}bug`);
  
  let bug = args.join(" ");
    if(!bug) return message.channel.send({embeds: [embed]});

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
        return message.reply(`Mmmmm, no funcionó. Resulta que estás baneado de mi base de datos. Pregúntale a Jeffrey por qué ¯\\_(ツ)\_/¯.`);
      }
    })

}

module.exports.help = {
    name: "bugreport",
    alias: "bug"
}
