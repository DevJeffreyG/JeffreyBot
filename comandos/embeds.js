const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const embedImages = require("./../resources/embeds.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const ms = require("ms");

let mainChannel = Config.mainChannel;
let supportChannel = Config.supportChannel;
let gdps = Config.gdpsSupportChannel;
let rulesChannel = Config.rulesChannel;

module.exports.run = async (client, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  if (message.author.id != jeffreygID) return;
  message.delete();

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === "460583861928329217");
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(client.user.id === Config.testingJBID){
    jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
    adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
    modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");

    mainChannel = "797258710997139537";
    supportChannel = "803309710883160065";
    gdps = "803309815576789003";
    rulesChannel = "482993020472393741";
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
• Posibilidad de conseguir un 15% más de EXP y Jeffros.

<@&${Config.lvl20}>
• 15% de descuento en la Jeffrey Shop.

<@&${Config.lvl30}>
• Bono de **${Emojis.Jeffros}2000**.

<@&${Config.lvl40}>
• Cooldown para conseguir Jeffros y EXP reducido a la mitad. (30s)

<@&${Config.lvl50}>
• Posibilidad de conseguir un 50% más de EXP y Jeffros.

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

  // CANALES
let canalesEmbed = new Discord.MessageEmbed()
.setImage(embedImages.canales)
.setColor(Colores.verde);

let canalesEmbed2 = new Discord.MessageEmbed()
.setTitle(`— Información de los canales del servidor`)
.setDescription(`**—** A continuación se explicarán la mayoría de los canales por categorías del servidor y sus respectivas funciones.
**—** Para información más específica, algunos canales tienen información en sus respectivas descripciones.
**—** Algunos de los canales no explicados aquí son canales ocultos que sólo aquellos que los desbloqueen podrán verlos.`)
.setColor(Colores.nocolor)

let canalesEmbed3 = new Discord.MessageEmbed()
.setTitle(`📖 — CHAPTER ONE`)
.setDescription(`<#523159573935423509> • Las reglas del servidor, si hablas en el chat aseguras haberlas leído.

<#485191307346837507> • Información general de todo el servidor, aquí pueden resolverse varias dudas que puedas tener.

<#485191462422577182> • En este canal se harán anuncios a cerca del servidor de discord en su mayoría.

<#834053291532615770> • En este canal se responden algunas de las preguntas que se hacen al staff con mayor frecuencia.

<#668488733804462110> • Aquí se publican los mensajes que han sido destacados por medio de los **Awards**.

<#548968993034338304> • Aquí se envían capturas de eventos memorables que ocurren en el servidor.

<#524647331551772672> • Aquí puedes elegir tu color para tu nombre dentro del server.

<#552580632266407957> • Aquí se encontrarán más colores para aquellos que tengan permisos de verlos.

<#447813323149410304> • Puedes recibir opcionalmente notificaciones de las redes sociales de Jeffrey en este canal
➟ Consíguelo en <#473627930396852226>.`)
.setColor(Colores.nocolor);

let canalesEmbed4 = new Discord.MessageEmbed()
.setTitle(`🌎 — SURFACE`)
.setDescription(`<#447802627187539968> • Este es canal general, aquí puedes hablar con los demás usuarios del servidor de cualquier tema.

<#447797737216278531> • Si tienes problemas, dudas, quejas, sugerencias del servidor este es lugar para pedir soporte.

<#839861097770123334> • Este canal se usará para comunicarte con el STAFF si crees que algún tipo de moderación fue hecha injustamente mientras un sistema de tickets es implementado.

<#485192397228081162> • Canal en donde debes usar los bots del servidor.

<#502255217379770428> • Si vienes del tutorial del GDPS, y buscas ayuda, puedes preguntar en este canal.

<#485192438701359135> • En este canal puedes hablar fuera de contexto, o hacer spam, **no se permite el flood**.

<#821486638768455700> • Aquí se puede hacer tanto SPAM como FLOOD, siendo este último el principal y el único sitio donde puede hacerse.

<#552580632266407957> • Aquí se encontrarán más colores para aquellos que tengan permisos de verlos.

<#447813323149410304> • Puedes recibir opcionalmente notificaciones de las redes sociales de Jeffrey en este canal
➟ Consíguelo en <#473627930396852226>.`)
.setColor(Colores.nocolor);

let canalesEmbed5 = new Discord.MessageEmbed()
.setTitle(`🎮 — ARCADE`)
.setDescription(`<#564971690304602113> • <@!467377486141980682> Cuenta con los demás usuarios del sevidor, ¿hasta dónde podrán llegar?

<#723304597191393301> • <@!520282851925688321> ¡Simulador de minería de minecraft en el servidor!

<#820002227958841344> • <@!715906723982082139> Puedes jugar un juego de trivia con todos los miembros del servidor.`)
.setColor(Colores.nocolor);

  // ROLES

  let rolesEmbed = new Discord.MessageEmbed()
    .setImage(`${embedImages.roles}`)
    .setColor(Colores.verde);

  let rolesEmbed2 = new Discord.MessageEmbed()
    .setTitle(`<:Users:494281768883716096> — Roles básicos y especiales`)
    .setDescription(`
\`➟\` Los roles básicos se obtienen sin esfuerzo alguno. Y no tienen mucha influencia a la hora de estar en el server.

\`➟\` Y por el contrario, los roles especiales, tienen cierto impacto en el server. Estos también tienen más dificultad para conseguirlos.`
    )
    .setColor(Colores.nocolor);

  let rolesEmbed3 = new Discord.MessageEmbed()
    .setTitle(`Roles básicos`)
    .setDescription(`<@&460966148704436235> • Todos aquellos que hayan aceptado las reglas tendrán este rol.

<@&447821238631530498> • Todos los Bots del server tendrán este rol.

<@&460242238555815946> • ¡Verdaderos suscriptores que tienen un canal para recibir notificaciones de Videos, Directos y Tweets de Jeffrey!
➟ Consíguelo en <#473627930396852226>.

<@&573308631018110986> • Personas dentro del server que quieren estar al tanto de las novedades de ${client.user}.
➟ Consíguelo en <#473627930396852226>.

<@&779783625398812673> • Personas que tienen acceso a la DarkShop y desean recibir menciones de eventos de la inflación e información de la DarkShop en general.
➟ Consíguelo en <#473627930396852226>.

<@&564144046591705089> • Con este rol, los VIPs pueden recibir notificaciones de vídeos de Jeffrey antes que sean públicos.
➟ Consíguelo en <#595986219364646923>.

<@&790995699759448094> • Shhh... los usuarios con nivel 5 tendrán este rol, y consigo acceso a la DarkShop.

<@&461302293464219658> • Personas que se la pasan bien en el servidor y es bueno con los demás~

<@&461553370277347328> • Persona de confianza para Jeffrey.

<@&508385695929466881> • Persona que ha ayudado al desarrollo de Jeffrey Bot de alguna forma. 💚`)
    .setColor(Colores.nocolor);

  let rolesEmbed4 = new Discord.MessageEmbed()
  .setTitle(`Roles especiales`)
  .setDescription(`<@&595022419123634228> • Alguien que está boosteando el servidor, aparecerá en la lista de miembros por encima de todos menos del Staff.

<@&529275759521431553> • Usuario que ha ascendido en el servidor, tendrá colores exclusivos y acceso anticipado a las notificaciones de Jeffrey, etc.
➟ Si quieres conseguirlo antes de <@&${Config.lvl99}> ve a \`${prefix}shop\`.

<@&461259197368107020> • Personas las cuales tienen algún tipo de relación IRL con Jeffrey o/

<@&460586399981109278> • Gente activa con más de 5,000 mensajes en <#${mainChannel}>.

<@&460517579941740544> • Personas que lleva mucho tiempo dentro del servidor, o está desde tiempos inmemorables, o simplemente estaba en el servidor viejo (...) este rol es muy extraño.`)
    .setColor(Colores.nocolor);

  // JEFFROS

  let jeffrosEmbed = new Discord.MessageEmbed()
    .setImage(`${embedImages.jeffros}`)
    .setColor(Colores.verde);

  let jeffrosEmbed2 = new Discord.MessageEmbed()
    .setDescription(`**—** ¿Qué son los ${Emojis.Jeffros}effros y como conseguirlos?
➟ Los Jeffros son la moneda virtual del servidor. Puedes conseguirlos al hablar en <#${mainChannel}>.

**—** ¿Cómo gasto mis Jeffros?
➟ Los Jeffros se usarán para comprar items en la tienda del servidor (\`${prefix}shop\`) y usar los **Awards**.

**—** No confundir con los __Dark${Emojis.Dark}effros__:
➟ Los DarkJeffros se desbloquearán cuando un usuario consiga el nivel 5. Podrán ser usados en la DarkShop.

**—** ¿Como consigo DarkJeffros?
➟ Piensa en los DarkJeffros como si fuesen bitcoins... ¿Por qué bitcoins? Porque es divertido.
➟ Los DarkJeffros solo se podrán conseguir cambiando Jeffros. Estos pueden ser más costosos dependiendo de la **inflación actual**.
➟ Usando el comando \`${prefix}darkshop ayuda\` podrás tener más información.`
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
    .setDescription(`${staffRole} • Todo aquel que tenga este rol, es parte del equipo del STAFF.

${adminRole} • ${modRole}.

➟ ${jeffreyRole} • Es el rol de JeffreyG. Ten por seguro que si alguien tiene este rol es porque es el verdadero Jeffrey.

➟ Usando el comando \`${prefix}serverinfo\` podrás ver quiénes hacen parte del equipo del Staff más cómodamente.`
    )
    .setColor(Colores.verde);

// INTERESES
let interestEmbed = new Discord.MessageEmbed()
.setImage(embedImages.interest)
.setColor(Colores.verde);

let interestEmbed2 = new Discord.MessageEmbed()
.setDescription(`**—** Aquellos usuarios con una suma mayor a **${Emojis.Jeffros}20.000**, deberán pagar los siguientes intereses los días 28 de cada mes, a las 12:00 GMT-5:

Más de **${Emojis.Jeffros}90.000** ➟ **20%**
Más de **${Emojis.Jeffros}40.000** ➟ **10%**
Más de **${Emojis.Jeffros}25.000** ➟ **5%**
Más de **${Emojis.Jeffros}20.000** ➟ **1%**`)
.setColor(Colores.nocolor)

// AWARDS
let silver = guild.emojis.cache.find(x => x.id === Config.silverAward);
let gold = guild.emojis.cache.find(x => x.id === Config.goldAward);
let platinium = guild.emojis.cache.find(x => x.id === Config.platiniumAward);

silver = silver ? silver : "SILVER EMOTE";
gold = gold ? gold : "GOLD EMOTE";
platinium = platinium ? platinium : "PLAT EMOTE";

let awardsEmbed = new Discord.MessageEmbed()
.setImage(embedImages.awards)
.setColor(Colores.verde);

let awardsEmbed2 = new Discord.MessageEmbed()
.setDescription(`**—** ¿Qué son los Awards?
**➟** Los Awards, como su nombre lo dice traducido al español, son una serie de premios que se muestran en un mensaje.

**—** ¿Como le doy un premio a un mensaje?
**➟** Para dar un Award, es tan fácil como reaccionar al mensaje que quieres darle el premio, con el premio deseado.`)
.setFooter(
  `Idea de los Awards tomada de REDDIT.`,
  "https://www.redditinc.com/assets/images/site/reddit-logo.png"
)
.setColor(Colores.nocolor);

let awardsEmbed3 = new Discord.MessageEmbed()
.setDescription(`**${silver} Plata** • Cuesta **${Emojis.Jeffros}100**, se envía el mensaje a <#${Config.hallChannel}> y ya está.

**${gold} Oro** • Cuesta **${Emojis.Jeffros}500**, se envía el mensaje a <#${Config.hallChannel}>, se le da **${Emojis.Jeffros}100** al autor del mensaje premiado.

**${platinium} Platino** • Cuesta **${Emojis.Jeffros}1800**, se envía el mensaje a <#${Config.hallChannel}>, se le da __**${Emojis.Jeffros}700**__ al autor del mensaje premiado.`)
.setColor(Colores.nocolor);
  
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
Aunque creo que es obvio tengo que aclarar que usará a ${client.user} para la moderación del servidor. Puedes ver tus comandos con \`/ayuda\`.

<:Faq:494282181296914432> **— ¿Cuando dar un warn y cuando no?**
Es sencillo. Cuando un usario incumpla una regla hay que tener en cuenta una sóla cosa:
**¿Se le ha advertido de forma textual en el chat con anterioridad, y a su vez se le ha dado un softwarn?**
> "Sí": Procede con el warn.
> "No": Adviertele por medio del chat, **y luego softwarneal@**. Si continúa pues métele un warn entre pecho y espalda.

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
> ➟ No te tomes esto como lo más serio de mundo. Todos estamos aquí para divertirnos, ¿verdad? relájate un poco.`);

let finalInfoEmbed = new Discord.MessageEmbed()
.setColor(Colores.verde)
.setDescription(`**— Y... ¡eso es todo!**
• Esperamos te la pases bien en el server, si tienes dudas del server no dudes preguntar en <#${supportChannel}> y no olvides leer las <#${rulesChannel}>.`)

let noEmbed = new Discord.MessageEmbed()
.setAuthor(`| ¿Qué necesitas?`, author.displayAvatarURL())
.setColor(Colores.nocolor)
.setDescription(`**—** ${prefix}embed <embed>
\`▸\` Informacion
\`▸\` Muted
\`▸\` Reglas
\`▸\` Niveles
\`▸\` Roles
\`▸\` Canales
\`▸\` Jeffros
\`▸\` Interes
\`▸\` Awards
\`▸\` Staff
\`▸\` Colores
\`▸\` Colores_especiales
\`▸\` Auto_Roles
\`▸\` Roles_especiales
\`▸\` Staff_manual
\`▸\` Final_info`);

  if (!args[0]) return message.channel.send(noEmbed).then(m => m.delete({ timeout: ms("10s") }));
  let embed1 = new Discord.MessageEmbed();
  let embed2 = new Discord.MessageEmbed();
  let embed3 = new Discord.MessageEmbed();
  let caso = args[0].toLowerCase();
  let shrug = "¯\\_(ツ)_/¯";
  switch (args[0]) {
    case (caso = "informacion"):
      //niveles
      await message.channel.send(lvlEmbed1);
      await message.channel.send(lvlEmbed2);
      //canales
      await message.channel.send(canalesEmbed);
      await message.channel.send(canalesEmbed2);
      await message.channel.send(canalesEmbed3);
      await message.channel.send(canalesEmbed4);
      await message.channel.send(canalesEmbed5);
      //roles
      await message.channel.send(rolesEmbed);
      await message.channel.send(rolesEmbed2);
      await message.channel.send(rolesEmbed3);
      await message.channel.send(rolesEmbed4);
      //jeffros
      await message.channel.send(jeffrosEmbed);
      await message.channel.send(jeffrosEmbed2);
      //interes
      await message.channel.send(interestEmbed);
      await message.channel.send(interestEmbed2);
      //awards
      await message.channel.send(awardsEmbed);
      await message.channel.send(awardsEmbed2);
      await message.channel.send(awardsEmbed3);
      //staff
      await message.channel.send(staffEmbed);
      await message.channel.send(staffEmbed2);
      await message.channel.send(staffEmbed3);
      await message.channel.send(staffEmbed4);
      //final
      await message.channel.send(finalInfoEmbed);
      break;

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
      embed2.setDescription(`**Regla N°1**: Escribe en el chat como si estuvieses hablando con alguien que te importa mucho, con **sentido común** y **sin incoherencias**.

**Regla N°2**: Trata a las personas con las que no tienes tanta confianza con **respeto y amabilidad**. No menciones innecesariamente. No gore ni contenido que pueda herir la sensibilidad de los demás **(NO NSFW)**.

**Regla N°3**: Cada canal tiene un fin, **escribe dónde debas hacerlo**. Siempre lee las descripciones de los canales.

**Regla N°4**: No hables de problemas personales en los chats, eso es privado y debería mantenerse así.

**Regla N°5**: **No flood ni spam** en los canales generales.

**Regla N°6**: No nicknames inapropiados ni con símbolos que no te dejen mencionarlos ni que cambien drásticamente tu posición en la lista de miembros.

**Regla N°7**: No se permiten cadenas de mensajes en el chat.

**Regla N°8**: No reclames/quejes en **canales generales**, acerca de tus warns/softwarns o cualquier acción de moderación que se haya aplicado, ya que puedes incomodar a otros usuarios con tus quejas, para ello, próximamente se **implementará** un sistema de tickets donde podras comunicarte con el STAFF directamente.
➟ De mientras, mantén estos temas en <#839861097770123334>.

**Regla N°9**: **Debes** cumplir las [Condiciones del servicio de Discord "TOS"](https://discord.com/terms) y sus [Directivas de la comunidad](https://discord.com/guidelines).

\`—\` Un dato curioso: ${client.user} te enviará un mensaje al recibir cualquier tipo de warn, siempre y cuando tengas los MDs activados.
Esto no es obligatorio, siempre puedes usar el comando \`${prefix}warns\` para conocer __tus__ warns.`);
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
      message.channel.send(awardsEmbed).then(m => {
        message.channel.send(awardsEmbed2).then(s => {
          message.channel.send(awardsEmbed3);
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

    case (caso = "canales"):
      await message.channel.send(canalesEmbed);
      await message.channel.send(canalesEmbed2);
      await message.channel.send(canalesEmbed3);
      await message.channel.send(canalesEmbed4);
      await message.channel.send(canalesEmbed5);

      break;

    case (caso = "jeffros"):
      message.channel.send(jeffrosEmbed).then(() => {
        message.channel.send(jeffrosEmbed2);
      });
      break;

    case (caso = "interes"):
      await message.channel.send(interestEmbed);
      await message.channel.send(interestEmbed2);
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

    case (caso = "final_info"):
      message.channel.send(finalInfoEmbed);
      break;

    case (caso = "edit"):
      if (args[1] === "auto_roles") {
        let nchannel = guild.channels.cache.find(x => x.id === Config.gRoleC);
        nchannel.messages.fetch(Config.mGRoles).then(m => {
          let nembed = new Discord.MessageEmbed()
            .setDescription(
              `**—** Reacciona de acuerdo a los roles que quieras tener.

🔔 ➟ <@&${Config.teamcampanita}>
🤖 ➟ <@&${Config.jbnews}>
💀 ➟ <@&${Config.dsnews}>`
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
