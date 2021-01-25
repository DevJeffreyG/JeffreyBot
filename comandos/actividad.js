const Discord = require("discord.js");
const Config = require(".././base.json");
let prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;

module.exports.run = async (client, message, args) => {

    if(!message.content.startsWith(prefix))return;

    let argcustom = args.join(" ");
  
    let wrongembed = new Discord.MessageEmbed()
    .setColor(0xED0C0C)
    .setAuthor(`| ERROR`, Config.errorPng)
    .setDescription(`${message.author}, No eres desarrollador para hacer esto.`);

  if (message.author.id != jeffreygID) {
    return message.channel.send(wrongembed);
  }
  
  if(argcustom == "default") {
      let setgamembed2 = new Discord.MessageEmbed()
        .setColor(0x07DE47)
        .setAuthor(`| Actividad seleccionada sin problemas.`, Config.bienPng)
        .setDescription(`${client.user.username} tiene el juego por DEFAULT.`)
        .setFooter(`Puesto por ${message.author.username}.`, message.author.avatarURL);
        client.user.setActivity(`${prefix}ayuda - ${guild.memberCount} usuarios🔎`);
        return message.channel.send(setgamembed2);
  }

  let specifyembed = new Discord.MessageEmbed()
    .setColor(0xED0C0C)
    .setAuthor(`| Error al poner nueva actividad`, Config.errorPng)
    .setDescription(`${message.author}, Por favor, pon un juego para jugar.`);

  let setgamembed = new Discord.MessageEmbed()
    .setColor(0x07DE47)
    .setAuthor(`| Actividad seleccionada sin problemas.`, Config.bienPng)
    .setDescription(`${client.user.username} ahora juega \`${argcustom}\`.`)
    .setFooter(`Puesto por ${message.author.username}.`, message.author.avatarURL);


  if (!argcustom[0]) return message.channel.send(specifyembed);

  client.user.setActivity(argcustom);
  console.log(`${client.user.username} Ahora juega ${argcustom}.`);
  message.channel.send(setgamembed);
}

module.exports.help = {
    name: "actividad"
}
