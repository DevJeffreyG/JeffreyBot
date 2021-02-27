const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;
  await message.delete();

  // Variables
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);

  if(client.user.id === Config.testingJBID){
    jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
    adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
    modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
  }

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}clear`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}clear <N° de mensajes>`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}limpiar`);
  
  let delMgs = Number(args[0]);

  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  if(!delMgs) return message.channel.send(embed);

  message.channel.bulkDelete(delMgs).then(deleMsg => {
  message.channel.send(`Limpiados ${deleMsg.size} mensajes.`).then(msg => msg.delete({timeout: 7000}));
}).catch(err => {
    console.log(err);
  message.reply(`Sólo puedo eliminar mensajes que sean menores de 14 días. <:jgSad:492115297533165569>`).then(msg => msg.delete({timeout: 7000}));
});

}

module.exports.help = {
    name: "clear",
    alias: "limpiar"
}
