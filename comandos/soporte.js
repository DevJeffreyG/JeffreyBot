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

const embedImages = require("./../embeds.json");

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Reporte = require("../modelos/reporte.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Banned = require("../modelos/banned.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;
  message.delete();

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  
  const filter = m => m.author.id === author.id;
  
  let noSoporte = new Discord.MessageEmbed()
  .setAuthor(`| ¿Qué necesitas?`, author.displayAvatarURL())
  .setColor(Colores.nocolor)
  .setDescription(`**—** ¿De qué quieres saber?
\`▸\` Niveles
\`▸\` Roles
\`▸\` Jeffros
\`▸\` Staff`)
  .setFooter(`Responde en los próximos 10 segundos | "Cancelar" o "Cancel" para cancelar.`);
  
  let cancelE = new Discord.MessageEmbed()
  .setDescription(`Cancelado.`)
  .setColor(Colores.rojo);
  
  
  /* ################## EMBEDS DE INFORMACION ######################### */
  
  // NIVELES
  
  let lvlEmbed1 = new Discord.MessageEmbed()
  .setImage(`${embedImages.niveles}`)
  .setColor(Colores.verde);
  
  let lvlEmbed2 = new Discord.MessageEmbed()
  .setDescription(`
<@&${Config.lvl1}>
• Puedes colorear tu nombre en <#524647331551772672>.
• Archivos y links.
• Emojis globales.
• Agregar reacciones a los mensajes.

<@&${Config.lvl10}>
• Cambiarse el apodo.
• Posibilidad de conseguir un 115% más de EXP y Jeffros.

<@&${Config.lvl20}>
• 15% de descuento en la Jeffrey Shop.

<@&${Config.lvl30}>
• Bono de **${Emojis.Jeffros}2000**.

<@&${Config.lvl40}>
• Cooldown para conseguir Jeffros y EXP reducido a la mitad. (30s)

...

<@&${Config.lvl99}>
• VIP Desbloqueado.

<@&${Config.lvl100}>
• Rol personalizado.`)
  .setFooter(`Existen más roles, pero por el momento no tienen beneficios.`, Config.jeffreyguildIcon)
  .setColor(Colores.nocolor);
  
  
  // ROLES
  
  
  let rolesEmbed = new Discord.MessageEmbed()
  .setImage(`${embedImages.roles}`)
  .setColor(Colores.verde);
  
  let rolesEmbed2 = new Discord.MessageEmbed()
  .setTitle(`<:Users:494281768883716096> — Roles básicos y especiales`)
  .setDescription(`
  \`➟\` Los roles básicos se obtienen sin esfuerzo alguno. Y no tienen mucha influencia a la hora de estar en el server.

  \`➟\` Y por el contrario, los roles especiales, tienen cierto impacto en el server. Estos también tienen más dificultad para conseguirlos.`)
  .setColor(Colores.nocolor);
  
  let rolesEmbed3 = new Discord.MessageEmbed()
  .setDescription(`<@&460966148704436235> • Todos tendrán este rol.

<@&460242238555815946> • ¡Verdaderos suscriptores que tienen un canal para recibir notificaciones de Videos, Directos y Tweets de Jeffrey!
  ➟ Consíguelo en <#473627930396852226>.

<@&461259197368107020> • Alguien cercano a Jeffrey.  

<@&461302293464219658> • Personas que se la pasan bien en el servidor y es bueno con los demás~

<@&529275759521431553> • Usuario que ha pagado por tener colores exclusivos y acceso anticipado a las notificaciones de Jeffrey, etc. \`( Más info en '${prefix}shop items' )\`.

<@&461553370277347328> • Persona de confianza para Jeffrey.

<@&460586399981109278> • Gente activa con más de 5,000 mensajes en <#${mainChannel}>.

<@&460517579941740544> • Personas que lleva mucho tiempo dentro del servidor.`)
  .setColor(Colores.nocolor);
  
  // JEFFROS
  
  let jeffrosEmbed = new Discord.MessageEmbed()
  .setImage(`${embedImages.jeffros}`)
  .setColor(Colores.verde);
  
  let jeffrosEmbed2 = new Discord.MessageEmbed()
  .setDescription(`
    **—** ¿Qué son los ${Emojis.Jeffros}effros?
    ➟ Los Jeffros, son la moneda virtual que se usará para comprar items en la tienda del servidor y usar los **Awards**.

    **—** ¿Cómo gasto mis Jeffros?
    ➟ Con el comando \`${prefix}shop\` tendrás más información de los items.
  `)
  .setColor(Colores.nocolor);
  
  // STAFF
  
  let staffEmbed = new Discord.MessageEmbed()
  .setImage(`${embedImages.staff}`)
  .setColor(Colores.verde);
  
  let staffEmbed2 = new Discord.MessageEmbed()
  .setImage(`${embedImages.ceo}`)
  .setColor(Colores.nocolor);
  
  let staffEmbed3 = new Discord.MessageEmbed()
  .setImage(`${embedImages.mod}`)
  .setColor(Colores.nocolor);
  
  let staffEmbed5 = new Discord.MessageEmbed()
  .setDescription(`${staffRole} • Todo aquel que tenga este rol, es parte del equipo del STAFF.

  ${adminRole} • ${modRole}.

  ➟ ${jeffreyRole} • Es el rol de JeffreyG. Ten por seguro que si alguien tiene este rol es porque es el verdadero Jeffrey.

  `)
  .setColor(Colores.verde);

  
  // /soporte (roles, niveles)
  
  if(!args[0]){
    message.channel.send(noSoporte)
    .then(selectingSoporte => {
      message.channel.awaitMessages(filter, {
        max: 1,
        time: ms('10s')
      }).then(collectedSupport => {
        let messageID = message.channel.messages.fetch(selectingSoporte.id);
        if(collectedSupport.first().content.toLowerCase() === "cancel" || collectedSupport.first().content.toLowerCase() === "cancelar"){
            collectedSupport.first().delete();
            return selectingSoporte.edit(cancelE).then(r => r.delete(5000));
        }
        
        if(collectedSupport.first().content.toLowerCase() === "niveles"){
            message.channel.send(lvlEmbed1)
            .then(m => message.channel.send(lvlEmbed2));
        } else
          
        if(collectedSupport.first().content.toLowerCase() === "roles"){
          message.channel.send(rolesEmbed)
          .then(m => message.channel.send(rolesEmbed2))
          .then(m => message.channel.send(rolesEmbed3));
        } else
          
        if(collectedSupport.first().content.toLowerCase() === "jeffros"){
          message.channel.send(jeffrosEmbed)
          .then(m => message.channel.send(jeffrosEmbed2));
        } else
          
        if(collectedSupport.first().content.toLowerCase() === "staff"){
          message.channel.send(staffEmbed)
          .then(m => message.channel.send(staffEmbed2))
          .then(m => message.channel.send(staffEmbed3))
          .then(m => message.channel.send(staffEmbed5));
        }
      })
    })
  } else {
  
    let typeSupport = args[0].toLowerCase();

    if(typeSupport === "niveles" || typeSupport === "levels"){
      message.channel.send(lvlEmbed1)
      .then(m => message.channel.send(lvlEmbed2));
    } else

    if(typeSupport === "roles" || typeSupport === "role"){
      message.channel.send(rolesEmbed)
      .then(m => message.channel.send(rolesEmbed2))
      .then(m => message.channel.send(rolesEmbed3));
    } else
      
    if(typeSupport === "jeffros" || typeSupport === "jeff" || typeSupport === "money" || typeSupport === "dinero"){
      message.channel.send(jeffrosEmbed)
      .then(m => message.channel.send(jeffrosEmbed2));
    } else
    if(typeSupport === "staff" || typeSupport === "ceo" || typeSupport === "admin" || typeSupport === "mod" || typeSupport === "helper"){
      message.channel.send(staffEmbed)
      .then(m => message.channel.send(staffEmbed2))
      .then(m => message.channel.send(staffEmbed3))
      .then(m => message.channel.send(staffEmbed5));
    }
  }

}

module.exports.help = {
    name: "soporte"
}
