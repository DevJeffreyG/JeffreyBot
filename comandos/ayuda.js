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
  let via = args[0];
    
  let ayudaEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos generales`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}ayuda\`: Te muestra este mensaje.
▸ \`${prefix}soporte\`: Recibe ayuda / información del servidor.
▸ \`${prefix}bugreport\`: Puedes reportar un bug, para que Jeffrey lo arregle.
▸ \`${prefix}botinfo\`: Información del bot.
▸ \`${prefix}serverinfo\`: Información del servidor. __No es lo mismo que ${prefix}soporte__.
▸ \`${prefix}rep\`: Dale un punto de reputación a un usuario. ^^
▸ \`${prefix}traducir\`: Traduce un texto a cualquier idioma.
▸ \`${prefix}ping\`: ¡Pong!`)
  .setColor(Colores.verde);
  
  let funEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos de diversión`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}perfil\`: Accede a tu perfil en la Jeffrey Net. *\`${prefix}perfil config\` para configurarlo.*
▸ \`${prefix}say\`: Me dices que decir.
▸ \`${prefix}encuesta\`: Puedes hacer una encuesta.
▸ \`${prefix}8ball\`: La clásica 8Ball.`)
  .setColor(Colores.verde);
  
  let musicEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos de música`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}play\`: Reproduce música uniendote a un canal de voz, seguido de una url; busca la canción por su nombre en YouTube o simplemente resumir una canción pausada.
▸ \`${prefix}search\`: Sirve como extensión para \`${prefix}play\` y como comando independiente para buscar canciones vía YouTube.
▸ \`${prefix}pause\`: Pausas la canción en reproducción.
▸ \`${prefix}resume\`: Sirve como extensión para \`${prefix}play\` y como comando independiente para resume una canción pausada.
▸ \`${prefix}leave\`: Hace salir al bot del canal de voz y parar la música. *(Sólo funcionará si estás solo en el canal de voz, o si eres Staff.)*
▸ \`${prefix}skip\`: Añade votos para saltar a la siguiente canción en la cola.
▸ \`${prefix}queue\`: Te muestra la cola de canciones actuales.
`)
  .setColor(Colores.verde)
  .setFooter(`| Work in progress!`, "https://cdn.discordapp.com/emojis/494267320097570837.png?v=1");
  
  let economyEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos de economía y EXP`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}top\`: Obten el Top 10 de los ${Emojis.Jeffros}effros o EXP, lo que desees.
▸ \`${prefix}shop\`: Compra items en la Jeffrey Shop!
▸ \`${prefix}stats\`: Tus estadísticas: EXP, nivel, ${Emojis.Jeffros}effros, etc.
▸ \`${prefix}pay\`: Le das de tus ${Emojis.Jeffros}effros a otro usuario.
`)
  .setColor(Colores.verde);
  
  let modEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos de Moderación`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}ban\`: Baneas a un usuario.
▸ \`${prefix}kick\`: Kickeas a un usuario.
▸ \`${prefix}hackban\`: Baneas a un usuario que no está en el servidor, ideal para los raiders.
▸ \`${prefix}mute\`: Muteas temporal o permanentemente a un usuario.
▸ \`${prefix}clear\`: Elimina hasta 100 mensajes en un canal.
▸ \`${prefix}unmute\`: Desmuteas a un usuario.
▸ \`${prefix}unban\`: Desbaneas a un usuario.
▸ \`${prefix}warn\`: +X warn(s) a un usuario.
▸ \`${prefix}pardon\`: -X warn(s) a un usuario.
▸ \`${prefix}warns\`: Puedes saber cuántos warns tiene un usuario.`)

  .setColor(Colores.rojo);
  
  let jeffreyEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos de Desarrollador`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}actividad\`: Cambias lo que estoy jugando ahora.
▸ \`${prefix}syncMute\`: Sincronizas el rol de Mute en todos los canales.
▸ \`${prefix}dbBan\`: Prohíbe a alguien enviar un reporte de bug.
▸ \`${prefix}role\`: Conoce el ID de un rol por su nombre.`)
  .setColor(Colores.nocolor);
  
    if(!via){
    message.author.send(ayudaEmbed)
    .then(() => {
      message.author.send(funEmbed)
    }).then(() => {
      message.author.send(musicEmbed)
    })
    .then(() => {
      message.author.send(economyEmbed)
    }).then(() => {
      if(message.member.roles.cache.find(x => x.id === staffRole.id)){
        message.author.send(modEmbed)
      } else {
        console.log(`No tiene rol Staff.`);
      }
    })
    .then(() => {
      if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){
        message.author.send(jeffreyEmbed)
      } else {
        console.log(`No es Jeffrey.`)
      }
    })
    .catch(err => message.reply(`No te puedo ~~stalkear~~ enviar mensajes privados porque los tienes bloqueados. Intenta haciendo \`${prefix}ayuda ch\``));
    
  } else if (via == "ch") {
    message.channel.send(ayudaEmbed)
    .then(() => {
      message.channel.send(funEmbed)
    })
    .then(() => {
      message.channel.send(musicEmbed)
    })
    .then(() => {
      message.channel.send(economyEmbed)
    }).then(() => {
      if(message.member.roles.cache.find(x => x.id === staffRole.id)){
        message.channel.send(modEmbed)
      } else {
        console.log(`No tiene rol Staff.`);
      }
    })
    .then(() => {
      if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){
        message.channel.send(jeffreyEmbed)
      } else {
        console.log(`No es Jeffrey.`)
      }
    })
  } else if (via == "dm" || via == "md") {
    message.author.send(ayudaEmbed)
    .then(r => {
      message.author.send(funEmbed)
    })
    .then(() => {
      message.author.send(musicEmbed)
    })
    .then(() => {
      message.author.send(economyEmbed)
    }).then(() => {
      if(message.member.roles.cache.find(x => x.id === staffRole.id)){
        message.author.send(modEmbed)
      } else {
        console.log(`No tiene rol Staff.`);
      }
    })
    .then(() => {
      if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){
        message.author.send(jeffreyEmbed)
      } else {
        console.log(`No es Jeffrey.`)
      }
    })
    .catch(err => message.reply(`No te puedo ~~stalkear~~ enviar mensajes privados porque los tienes bloqueados. Intenta haciendo \`${prefix}ayuda ch\``));
    }

}

module.exports.help = {
    name: "ayuda",
    alias: "help"
}
