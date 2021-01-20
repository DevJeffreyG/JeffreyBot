const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // embeds*

  // Variables
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let via = args[0];

  if(bot.user.id === Config.testingJBID){
    jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }
    
  let ayudaEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos generales`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}ayuda\`: Te muestra este mensaje.
▸ \`${prefix}bugreport\`: Puedes reportar un bug, para que Jeffrey lo revise.
▸ \`${prefix}changelog\`: Información del bot: versión y sus últimos cambios.
▸ \`${prefix}serverinfo\`: Información del servidor.
▸ \`${prefix}rep\`: Dale un punto de reputación a un usuario. ^^
▸ \`${prefix}warns\`: Con este comando puedes revisar un resumen de tus warns (MD).
▸ \`${prefix}ping\`: ¡Pong!`)
  .setColor(Colores.verde);
  
  let funEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos de diversión`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}say\`: Me dices que decir.
▸ \`${prefix}vault\`: Si decifras unos acertijos pre-hechos por el staff podrás ganar Jeffros!
▸ \`${prefix}avatar\`: Enviaré tu foto o la de otro usuario al canal de texto.
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
▸ \`${prefix}usar\`: Usa los items que hayas comprado en la Jeffrey Shop de acuerdo a su ID.
▸ \`${prefix}darkshop\`: Compra items, e invierte en Dark${Emojis.Dark}effros en la ${Emojis.DarkShop}Dark Shop!
▸ \`${prefix}stats\`: Tus estadísticas: EXP, nivel, ${Emojis.Jeffros}effros, etc.
▸ \`${prefix}pay\`: Le das de tus ${Emojis.Jeffros}effros a otro usuario.
`)
  .setColor(Colores.verde);
  
  let modEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos de Staff`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`
▸ \`${prefix}autorole\`: Se inicia proceso de creación de un nuevo autorole.
▸ \`${prefix}dmuser\`: Jeffrey Bot enviará un mensaje a el usuario con lo que se especifique.
▸ \`${prefix}jbnews\`: Se crea un anuncio mencionando a el rol de JB News con un embed con la noticia.
▸ \`${prefix}reglas\`: Se envía un mensaje con las reglas registradas por Jeffrey Bot para ser usadas en comandos como \`${prefix}warn\`, \`${prefix}softwarn\` o \`${prefix}pardon\`.
▸ \`${prefix}ban\`: Baneas a un usuario.
▸ \`${prefix}kick\`: Kickeas a un usuario.
▸ \`${prefix}hackban\`: Baneas a un usuario que no está en el servidor, ideal para los raiders.
▸ \`${prefix}mute\`: Muteas temporal o permanentemente a un usuario.
▸ \`${prefix}clear\`: Elimina hasta 100 mensajes en un canal.
▸ \`${prefix}unmute\`: Desmuteas a un usuario.
▸ \`${prefix}unban\`: Desbaneas a un usuario.
▸ \`${prefix}warn\`: Le agregas un warn a un usuario.
▸ \`${prefix}softwarn\`: Le agregas un softwarn a un usuario.
▸ \`${prefix}pardon\`: -X warn(s) a un usuario. (Tanto Warns como Softwarns).
▸ \`${prefix}warns\`: Puedes saber cuántos warns tiene un usuario. (Tanto Warns como Softwarns)`)

  .setColor(Colores.rojo);
  
  let jeffreyEmbed = new Discord.MessageEmbed()
  .setAuthor(`| Comandos de Desarrollador`, "https://cdn.discordapp.com/emojis/494282181296914432.png")
  .setDescription(`▸ \`${prefix}actividad\`: Cambias lo que estoy jugando ahora.
▸ \`${prefix}syncMute\`: Sincronizas el rol de Mute en todos los canales.
▸ \`${prefix}add-jeffros\`: Añades Jeffros o Dark Jeffros a un usuario.
▸ \`${prefix}dbBan\`: Prohíbe a alguien enviar un reporte de bug.
▸ \`${prefix}emoji\`: Conoce la ID de un emote por su nombre en el server actual.
▸ \`${prefix}role\`: Conoce el ID de un rol por su nombre.
▸ \`${prefix}embeds\`: Diferentes embeds preestablecidos para usarlos en los canales de información.
▸ \`${prefix}toggle\`: Deshabilita cualquier comando para uso público sin necesidad de cambiar el código.`)
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
