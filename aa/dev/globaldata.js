const Colores = require("../../resources/colores.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, intervalGlobalDatas } = require("../../resources/functions.js");

const commandInfo = {
    name: "globaldatas",
    info: "Todos los tipos de GlobalDatas actuales. / Forzar ciclo de GlobalDatas",
    params: [
        {
            name: "update?", type: "Boolean", optional: true
        }
    ],
    userlevel: "DEVELOPER",
    category: "DEVELOPER"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        let update = response.find(x => x.param === "update?").data;

        // Comando
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
      
          if(!update){
              return message.channel.send({embeds: [embed]});
          } else {
              await intervalGlobalDatas(client);
      
              return message.reply("Interval de global datas ejecutado.")
              .then(m => {
                  message.delete();
                  setTimeout(() => {
                      m.delete()
                  }, ms("10s"));
              });
        }
    }
}