const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const logChannel = Config.logChannel;
const functions = require("./../resources/functions.js");

/* ##### MONGOOSE ######## */

const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(client.user.id === Config.testingJBID){
      jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
      adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
      modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
      staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  if(!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}give`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}give <ID | @usuario> <role | boost> <...> \n▸ Con este comando podrás agregar roles temporales o boosts temporales de cualquier tipo a algún usuario.`)
  .setFooter(`<> Obligatorio () Opcional`);

  if(!args[0]) return message.channel.send(embed)
  if(!args[1]) return message.channel.send(embed)

  let member = guild.member(message.mentions.users.first() || guild.members.cache.get(args[0]));

  if(!member) return message.channel.send(embed)

  if(args[1].toLowerCase() === "role"){
    // /give @jeffreyg role id time
    embed.setDescription(`▸ El uso correcto es: ${prefix}give ${member} role <id || @role> <tiempo>`);
    embed.setColor(Colores.rojo);

    // error id
    embed.setTitle(`Error: id`);
    if(!args[2]) return message.channel.send(embed);

    let role = guild.roles.cache.get(message.mentions.roles.first().id || args[2]);
    if(!role) return message.channel.send(embed);

    // error tiempo
    embed.setTitle(`Error: tiempo`);
    if(!args[3]) return message.channel.send(embed);

    let tiempo = ms(args[3]) || null;
    if(!tiempo) return message.channel.send(embed);

    // llamar la funcion para hacer globaldata
    await functions.LimitedTime(guild, role.id, member, tiempo);

    // agregar role
    member.roles.add(role).then(x => message.react("✅"));
  } else if (args[1].toLowerCase() === "boost"){
    // /give @jeffreyg boost tipo multiplier time

    embed.setDescription(`▸ El uso correcto es: ${prefix}give ${member} boost <jeffros | exp | all> <multiplicador (exp que daría normalmente x multiplicador)> <tiempo> <id | @role>`);
    embed.setColor(Colores.rojo);

    // error id
    embed.setTitle(`Error: tipo`);
    if(!args[2]) return message.channel.send(embed);

    let tipo = args[2];

    // error multiplicador
    embed.setTitle(`Error: multiplicador`);
    if(!args[3]) return message.channel.send(embed);

    let multi = !isNaN(args[3]) ? args[3] : null;
    if(!multi) return message.channel.send(embed);

    // error tiempo
    embed.setTitle(`Error: tiempo`);
    if(!args[4]) return message.channel.send(embed);

    let tiempo = ms(args[4]) ? args[4] : null;
    if(!tiempo) return message.channel.send(embed);

    // error id
    embed.setTitle(`Error: id`);
    if(!args[5]) return message.channel.send(embed);

    let role = guild.roles.cache.get(message.mentions.roles.first().id || args[5]);
    if(!role) return message.channel.send(embed);

    // llamar la funcion para hacer un globaldata y dar el role con boost
    await functions.LimitedTime(guild, role.id, member, tiempo, "boostMultiplier", tipo, multi);
    message.react("✅")
  } else {
      return message.channel.send(embed);
  }

}

module.exports.help = {
    name: "give"
}
