const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const embedImages = require("./../resources/embeds.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
let mainChannel = Config.mainChannel;

module.exports.run = async (bot, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  if (message.author.id != jeffreygID) return;
  message.delete();

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(bot.user.id === Config.testingJBID){
    jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
    adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
    modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");

    mainChannel = "797258710997139537";
  }

  /* ################## EMBEDS DE INFORMACION ######################### */

  // NIVELES

  let lvlEmbed1 = new Discord.MessageEmbed()
    .setImage(`${embedImages.niveles}`)
    .setColor(Colores.verde);

  let lvlEmbed2 = new Discord.MessageEmbed()
    .setDescription(
      `
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
• Rol personalizado.`
    )
    .setFooter(
      `Existen más roles, pero por el momento no tienen beneficios.`,
      Config.jeffreyguildIcon
    )
    .setColor(Colores.nocolor);

  // ROLES

  let rolesEmbed = new Discord.MessageEmbed()
    .setImage(`${embedImages.roles}`)
    .setColor(Colores.verde);

  let rolesEmbed2 = new Discord.MessageEmbed()
    .setTitle(`<:Users:494281768883716096> — Roles básicos y especiales`)
    .setDescription(
      `
  \`➟\` Los roles básicos se obtienen sin esfuerzo alguno. Y no tienen mucha influencia a la hora de estar en el server.

  \`➟\` Y por el contrario, los roles especiales, tienen cierto impacto en el server. Estos también tienen más dificultad para conseguirlos.`
    )
    .setColor(Colores.nocolor);

  let rolesEmbed3 = new Discord.MessageEmbed()
    .setDescription(
      `<@&460966148704436235> • Todos tendrán este rol.

<@&460242238555815946> • ¡Verdaderos suscriptores que tienen un canal para recibir notificaciones de Videos, Directos y Tweets de Jeffrey!
  ➟ Consíguelo en <#473627930396852226>.

<@&461259197368107020> • Alguien cercano a Jeffrey.  

<@&461302293464219658> • Personas que se la pasan bien en el servidor y es bueno con los demás~

<@&529275759521431553> • Usuario que ha pagado por tener colores exclusivos y acceso anticipado a las notificaciones de Jeffrey, etc. \`( Más info en '${prefix}shop items' )\`.

<@&461553370277347328> • Persona de confianza para Jeffrey.

<@&460586399981109278> • Gente activa con más de 5,000 mensajes en <#${mainChannel}>.

<@&460517579941740544> • Personas que lleva mucho tiempo dentro del servidor.`
    )
    .setColor(Colores.nocolor);

  // JEFFROS

  let jeffrosEmbed = new Discord.MessageEmbed()
    .setImage(`${embedImages.jeffros}`)
    .setColor(Colores.verde);

  let jeffrosEmbed2 = new Discord.MessageEmbed()
    .setDescription(
      `
    **—** ¿Qué son los ${Emojis.Jeffros}effros?
    ➟ Los Jeffros, son la moneda virtual que se usará para comprar items en la tienda del servidor y usar los **Awards**.

    **—** ¿Cómo gasto mis Jeffros?
    ➟ Con el comando \`${prefix}shop\` tendrás más información de los items.
  `
    )
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

  let staffEmbed4 = new Discord.MessageEmbed()
    .setDescription(
      `${staffRole} • Todo aquel que tenga este rol, es parte del equipo del STAFF.

  ${adminRole} • ${modRole}.

  ➟ ${jeffreyRole} • Es el rol de JeffreyG. Ten por seguro que si alguien tiene este rol es porque es el verdadero Jeffrey.

  `
    )
    .setColor(Colores.verde);
  
  // MANUAL
  let manualEmbed = new Discord.MessageEmbed()
  .setColor(Colores.nocolor)
  .setDescription(`Bienvenido al Staff. ¿O simplemente estás aquí para aclarar dudas? Pues bienvenido seas, también.
Ya supongo que sabes que función cumple cada rol de Staff. Sino, [pulsa acá](https://discordapp.com/channels/447797737216278528/485191307346837507/668568044146130959).

En este manual se mostrarán las instrucciones a la hora de hacer ciertas acciones en el servidor. Este manual se actualizará cuando sea necesario, y cuando se haga se dirá en <#525068953500778518>.`)
  
  let manualEmbed2 = new Discord.MessageEmbed()
  .setColor(Colores.verde)
  .setImage(embedImages.warns);
  
  let manualEmbed3 = new Discord.MessageEmbed()
  .setColor(Colores.nocolor)
  .setDescription(`Lo más importante del staff diría yo.
Aunque creo que es obvio tengo que aclarar que usará a ${bot.user} para la moderación del servidor. Puedes ver tus comandos con \`/ayuda\`.

<:Faq:494282181296914432> **— ¿Cuando dar un warn y cuando no?**
Es sencillo. Cuando un usario incumpla una regla hay que tener en cuenta una sóla cosa:
**¿Se le ha advertido de forma textual en el chat con anterioridad?**
> "Sí": Procede con el warn.
> "No": Adviertele por medio del chat, **sin warnearlo**. Si continúa pues métele un warn entre pecho y espalda.

Si la falta es grave (Cosas irreversibles: como publicar información/imágenes que afecten a un usuario sin necesidad de nada más), proceder con un castigo.
Puedes optar por un warn o de acuerdo a la situación, usar otros comandos de moderación.`);
  
  let manualEmbed4 = new Discord.MessageEmbed()
  .setColor(Colores.verde)
  .setImage(embedImages.req);
  
  let manualEmbed5 = new Discord.MessageEmbed()
  .setColor(Colores.nocolor)
  .setTitle("Requisitos para mantenerte como staff")
  .setDescription(`*Si eres staff antiguo, quizá quieras saltarte esto.*

Para mantener tu posición como staff, debes cumplir lo siguiente:
> ➟ No abusar de tu poder.
> ➟ Sé activo en el servidor. (No debes vivir dentro del servidor, pero tú me entiendes.)
> ➟ No des roles de staff y roles en general **(si no lo merecen)** a usuarios/amigos.
> ➟ Si tienes alguna duda, no lo pienses dos veces y pregunta en <#485191724369444865>.

Y la más importante:
> ➟ No te tomes esto como lo más serio de mundo. Todos estamos aquí para divertirnos, ¿verdad? relájate un poco.`)

  let noEmbed = new Discord.MessageEmbed()
    .setAuthor(`| ¿Qué necesitas?`, author.displayAvatarURL())
    .setColor(Colores.nocolor).setDescription(`**—** ${prefix}embed <embed>
\`▸\` Muted
\`▸\` Reglas
\`▸\` Niveles
\`▸\` Roles
\`▸\` Jeffros
\`▸\` Awards
\`▸\` Staff
\`▸\` Colores
\`▸\` Colores_especiales
\`▸\` Auto_Roles
\`▸\` Roles_especiales
\`▸\` Staff_manual`);

  if (!args[0]) return message.channel.send(noEmbed); //.then(m => m.delete(ms("10s")));
  let embed1 = new Discord.MessageEmbed();
  let embed2 = new Discord.MessageEmbed();
  let embed3 = new Discord.MessageEmbed();
  let caso = args[0].toLowerCase();
  let shrug = "¯\\_(ツ)_/¯";
  switch (args[0]) {
    case (caso = "colores"):
      embed1.setImage(embedImages.colors);
      embed1.setColor(Colores.verde);
      embed2.setDescription(
        `<:Colores:494280433765449733> **—** Aquí tienes variedad de 10 colores. ¡Usa uno solo!`
      );
      embed2.setFooter(
        `— Reacciona con el color que desees.`,
        Config.jeffreyguildIcon
      );
      embed2.setColor(Colores.nocolor);

      message.channel.send(embed1).then(m => {
        message.channel.send(embed2);
      });

      break;

    case (caso = "colores_especiales"):
      embed1.setImage(embedImages.specialColors);
      embed1.setColor(Colores.verde);
      embed2.setDescription(
        `<:Colores:494280433765449733> **—** Más colores para gente con suerte ${shrug}.`
      );
      embed2.setFooter(
        `— Reacciona con el color que desees.`,
        Config.jeffreyguildIcon
      );
      embed2.setColor(Colores.nocolor);

      message.channel.send(embed1).then(m => {
        message.channel.send(embed2);
      });

      break;

    case (caso = "spooky2019"):
      embed1.setImage(
        "https://cdn.glitch.com/2c61ee42-4a04-4a21-b074-65934d0afc88%2Fspookycolors2019.png?v=1570763922001"
      );
      embed1.setColor("#e9804d");
      embed2.setDescription(
        `**—** Vamos, ya sabes qué es esto.
**—**  Spooktober 2019, colores de halloween. **Stay spooky \🎃~**`
      );
      embed2.setFooter(
        `— Reacciona con el color que desees.`,
        "https://cdn.discordapp.com/attachments/464810032081666048/632053446349946909/DiscordLogoHalloween2019.png"
      );
      embed2.setColor(Colores.nocolor);

      message.channel.send(embed1).then(m => {
        message.channel.send(embed2);
      });

      break;

    case (caso = "reglas"):
      embed1.setImage(embedImages.reglas);
      embed1.setColor(Colores.verde);
      embed2.setDescription(`**—** Escribe en el chat como si estuvieses hablando con alguien que te importa mucho, con sentido común y sin incoherencias.

**—** Trata a las personas con las que no tienes tanta confianza con respeto y amabilidad. No gore ni contenido que pueda herir la sensibilidad de los demás.

**—** Cada canal tiene un fin, escribe dónde debas hacerlo. Siempre lee las descripciones de los canales.

**—** No hables de problemas personales en los chats, eso es privado y debería mantenerse así.

**—** No menciones innecesariamente.

**—** No flood ni spam en los canales generales.

**—** No nicknames inapropiados ni con símbolos que no te dejen mencionarlos ni que cambien drásticamente tu posición en la lista de miembros.

**—** No se permiten cadenas de mensajes en el chat.

\`—\` Un consejo amistoso: no desactives los MDs, nunca sabes cuando te pueden dar un warn y no enterarte de ello.`);
      embed2.setColor(Colores.nocolor);

      embed3.setFooter(
        `— ¡Gracias por leer! | Al hablar en el chat aseguras que has leído las reglas del servidor y que las cumplirás.`,
        Config.jeffreyguildIcon
      );
      embed3.setColor(Colores.verde);

      message.channel.send(embed1).then(m => {
        message.channel.send(embed2).then(s => {
          message.channel.send(embed3);
        });
      });

      break;

    case (caso = "auto_roles"):
      //<:jgGDPS:572597912815796235> ➟ <@&${Config.gdpszone}>
      embed1.setImage(embedImages.autoroles);
      embed1.setColor(Colores.verde);
      embed2.setDescription(`**—** Reacciona de acuerdo a los roles que quieras tener.

🔔 ➟ <@&${Config.teamcampanita}>
🤖 ➟ <@&${Config.jbnews}>`);
      embed2.setColor(Colores.nocolor);

      message.channel.send(embed1).then(m => {
        message.channel.send(embed2);
      });

      break;

    case (caso = "muted"):
      embed1.setImage(embedImages.muted);
      embed1.setColor("#2C2F33");
      embed2.setDescription(
        `**—** Haz sido muteado, ten la esperanza de que en algún momento serás desmuteado, **Stay Determined! <:determined:572982380852412436>**`
      );
      embed2.setColor(Colores.nocolor);

      message.channel.send(embed1).then(m => {
        message.channel.send(embed2);
      });

      break;

    case (caso = "roles_especiales"):
      embed1.setImage(embedImages.specialRoles);
      embed1.setColor(Colores.verde);
      embed2.setDescription(`**—** Como eres <@&529275759521431553>, tienes más roles **exclusivos** disponibles. Reacciona de acuerdo a los roles que quieras tener.

🌠 ➟ <@&564144046591705089>`);
      embed2.setColor(Colores.nocolor);

      message.channel.send(embed1).then(m => {
        message.channel.send(embed2);
      });

      break;

    case (caso = "awards"):
      let silver = guild.emojis.get(Config.silverAward);
      let gold = guild.emojis.get(Config.goldAward);
      let platinium = guild.emojis.get(Config.platiniumAward);

      embed1.setImage(embedImages.awards);
      embed1.setColor(Colores.verde);
      embed2.setDescription(`**—** ¿Qué son los Awards?
**➟** Los Awards, como su nombre lo dice traducido al español, son una serie de premios que se muestran en un mensaje.

**—** ¿Como le doy un premio a un mensaje?
**➟** Para dar un Award, es tan fácil como reaccionar al mensaje que quieres darle el premio, con el premio deseado.`);
      embed2.setFooter(
        `Idea de los Awards tomada de REDDIT.`,
        "https://www.redditinc.com/assets/images/site/reddit-logo.png"
      );
      embed2.setColor(Colores.nocolor);
      embed3.setDescription(`**${silver} Plata** • Cuesta **${Emojis.Jeffros}100**, se envía el mensaje a <#${Config.hallChannel}> y ya está.

**${gold} Oro** • Cuesta **${Emojis.Jeffros}500**, se envía el mensaje a <#${Config.hallChannel}>, se le da **${Emojis.Jeffros}100** al autor del mensaje premiado.

**${platinium} Platino** • Cuesta **${Emojis.Jeffros}1800**, se envía el mensaje a <#${Config.hallChannel}>, se le da __**${Emojis.Jeffros}700**__ al autor del mensaje premiado.`);
      embed3.setColor(Colores.nocolor);

      message.channel.send(embed1).then(m => {
        message.channel.send(embed2).then(s => {
          message.channel.send(embed3);
        });
      });

      break;

    case (caso = "niveles"):
      message.channel.send(lvlEmbed1).then(() => {
        message.channel.send(lvlEmbed2);
      });

      break;

    case (caso = "roles"):
      message.channel.send(rolesEmbed).then(() => {
        message.channel.send(rolesEmbed2).then(() => {
          message.channel.send(rolesEmbed3);
        });
      });

      break;

    case (caso = "jeffros"):
      message.channel.send(jeffrosEmbed).then(() => {
        message.channel.send(jeffrosEmbed2);
      });
      break;

    case (caso = "staff"):
      message.channel.send(staffEmbed).then(() => {
        message.channel.send(staffEmbed2).then(() => {
          message.channel.send(staffEmbed3).then(() => {
            message.channel.send(staffEmbed4);
          });
        });
      });
      break;
      
    case (caso = "staff_manual"):
      message.channel.send(staffEmbed).then(() => {
        message.channel.send(manualEmbed).then(() => {
          message.channel.send(manualEmbed2).then(() => {
            message.channel.send(manualEmbed3).then(() => {
              message.channel.send(manualEmbed4).then(() => {
                message.channel.send(manualEmbed5);
              });
            });
          });
        });
      })
      break;

    case (caso = "edit"):
      if (args[1] === "auto_roles") {
        let nchannel = guild.channels.cache.find(x => x.id === Config.gRoleC);
        nchannel.messages.fetch(Config.mGRoles).then(m => {
          let nembed = new Discord.MessageEmbed()
            .setDescription(
              `**—** Reacciona de acuerdo a los roles que quieras tener.

🔔 ➟ <@&${Config.teamcampanita}>
🤖 ➟ <@&${Config.jbnews}>`
            )
            .setColor(Colores.nocolor);
          m.edit(nembed);
        });
      }
  }
};

module.exports.help = {
  name: "embeds",
  alias: "embed"
};
