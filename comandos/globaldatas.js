const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const functions = require("./../resources/functions.js");

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;

  if(author.id != jeffreygID) return;
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}globaldatas`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ Alternativa: ${prefix}globaldatas update`)
  .addField(`▸ birthdayData`, `**—** Información de cumpleaños de un usuario.`)
  .addField(`▸ temporalGuildBan`, `**—** Información de un TempBan en el servidor.`)
  .addField(`▸ dsInflation`, `**—** La inflación actual de los DarkJeffros.`)
  .addField(`▸ dsDJDuration`, `**—** Información de la duración de los DarkJeffros de un usuario.`)
  .addField(`▸ dsEventRandomInflation`, `**—** El próximo evento de para la inflación de los DarkJeffros.`)
  .addField(`▸ roleDuration`, `**—** Información de Roles temporales (o no) que se les da a un usuario.`)
  .addField(`▸ jeffrosSubscription`, `**—** Información de una suscripción de un usuario.`)


    if(!args[0]){
        return message.channel.send({embeds: [embed]});
    } else if(args[0].toLowerCase() === "update"){
        await functions.intervalGlobalDatas();

        return message.reply("Interval de global datas ejecutado.")
        .then(m => {
            message.delete();
            m.delete({timeout: ms("10s")});
        });
    } else {
        return message.channel.send({embeds: [embed]});
    }
}

module.exports.help = {
    name: "globaldatas"
}
