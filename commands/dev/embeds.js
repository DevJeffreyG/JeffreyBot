const Discord = require("discord.js");
const { Command, Categories, Embed, importImage } = require("../../src/utils");
const { Colores, Config, EmbedImages, Bases } = require("../../src/resources");
const { ButtonStyle } = require("discord-api-types/v10");

const command = new Command({
    name: "embeds",
    desc: "Enviar embeds defaults para el servidor de JeffreyG",
    category: Categories.Developer
})

command.addOption({
    type: "string",
    name: "embed",
    desc: "Embed a mostrar",
    req: true,
    choices: ["Información", "Faq", "Muted", "Reglas", "Colores", "Colores especiales", "Auto Roles", "Vip Roles", "Staff Manual", "DarkShop Info", "Ticket"]
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const { Guilds } = models;
    const { Emojis } = client;
    
    const embed = params.embed.value;
    const shrug = "¯\\_(ツ)_/¯";

    const doc = await Guilds.getOrCreate(interaction.guild.id);

    // Variables
    let adminRolesDb = doc.getAdmins();
    let staffRolesDb = doc.getStaffs();

    let jeffreyRole = interaction.guild.roles.cache.get(Config.jeffreyRole);
    let modRole = interaction.guild.roles.cache.get(Config.modRole);

    let adminRoles = interaction.guild.roles.cache.filter(role => {
        return adminRolesDb.find(savedId => savedId === role.id)
    });
    let staffRoles = interaction.guild.roles.cache.filter(role => {
        return staffRolesDb.find(savedId => savedId === role.id)
    });

    let mainChannel = interaction.guild.channels.cache.get(Config.mainChannel);
    let rulesChannel = interaction.guild.channels.cache.get(doc.getChannel("general.rules"));
    let supportChannel = interaction.guild.channels.cache.get(Config.supportChannel);
    let newsChannel = interaction.guild.channels.cache.get(doc.getChannel("general.announcements"));
    let infoChannel = interaction.guild.channels.cache.get(doc.getChannel("general.information"));
    let faqChannel = interaction.guild.channels.cache.get(doc.getChannel("general.faq"));
    let hallOfFameChannel = interaction.guild.channels.cache.get(doc.getChannel("general.halloffame"));

    /* ################## EMBEDS DE INFORMACION ######################### */

    // FAQ TE AMO FRAZ
    let faq = importImage("preguntas");
    let faqEmbedIntro = new Embed()
        .setImage(faq.attachment)
        .defColor(Colores.verdejeffrey);

    let faqEmbedIntro2 = new Embed()
        .defDesc(`**<:jgThinking:869746312709537792> — Preguntas más frecuentes**
➟ El término preguntas frecuentes (FAQ) se refiere a una lista de preguntas y respuestas que surgen frecuentemente dentro de un determinado contexto y para un tema en particular.

➟ Como puedes imaginar, veremos las preguntas frecuentes que se hacen en este servidor. Se irán actualizando a medida que hayan más preguntas frecuentes :)`)
        .defColor(Colores.verde);

    // DARKSHOP
    let faqEmbed2 = new Embed()
        .defAuthor({ text: "DarkShop", icon: client.EmojisObject.Dark.url })
        .defDesc(`\`DS.Q1\` **— ¿Qué pasó con la DarkShop "DS"?**
> La **DS** ya está disponible, revisa <#836397833531818004> para enterarte como funciona el sistema si ya eres nivel 5.

\`DS.Q2\` **— ¿Por qué la inflación no cambia?**
> [Sí que cambia](https://discord.com/channels/447797737216278528/836397833531818004/870100021314478170), si no lo ha hecho, es porque hay mala suerte. Sé paciente.

\`DS.Q3\` **— ¿Qué significa ___ en la DarkShop?**
> Toda la información base a cerca de la DarkShop se encuentra en <#836397833531818004>. Si después de leerlo, aún tienes dudas, puedes usar <#447797737216278531>.

\`DS.Q4\` **— Ya no me sirven los comandos, ¿qué pasa?**
> Antes de la actualización de Jeffrey Bot v1.7.0 la DarkShop era un solo comando que contenía la inflación, cambios, depósitos, tienda, etc.
> Con la llegada de la actualización, tanto la DarkShop como la tienda ha tenido cambios en cuanto a sus comandos (los cuales puedes ver usando el Slash Command \`/ayuda\`), ya que se han creado más de estos que ya hacían las mismas acciones.
> Esto se hizo con el fin de mantener un mejor orden tanto para los nuevos usuarios como para los veteranos en el servidor.`)
        .defColor(Colores.negro);

    // SERVER
    let faqEmbed3 = new Embed()
        .defAuthor({ text: "Servidor", icon: interaction.guild.iconURL() })
        .defDesc(`\`SV.Q1\` **— ¿Por qué se eliminan mis archivos?**
> No se pueden enviar archivos [multimedia](https://www.significados.com/multimedia/) de **22:00** hasta **7:00** del día siguiente (GMT-5). Esto para evitar problemas debido a que en estas horas no hay STAFFs conectados.

\`SV.Q2\` **— ¿Por qué no hay eventos o sorteos?**
> **Por falta de ideas de parte de Jeffrey y del STAFF**. Así es, habrán eventos o sorteos pero pocos: por falta de ideas, mayormente los eventos son internos del servidor que todos pueden participar.

\`SV.Q3\` **— ¿Cuánta EXP y Jeffros gano por mensaje? ¿Hay cooldown?**
> Es aleatorio, pero en base, sin ningún tipo de multiplicador, o boost; ¡puedes ganar hasta **35 de EXP** y **15 Jeffros** por mensaje! Y sí, hay un cooldown base de 1 minuto.

\`SV.Q4\` **— ¿Qué significan los ${Emojis.DarkJeffros} en el comando \`/top\`?**
> Aquellos usuarios que tengan DarkJeffros, se mostrará la parte de los Jeffros que estos representan, haciendo la conversión dependiendo de la inflación actual. Esto para que se mantengan las posiciones de los usuarios equilibrados aunque se tengan algunos Jeffros invertidos en la **DarkShop**; los Jeffros que salen de primero son los totales que tiene el usuario, se incluyen los que están en la DarkShop.

\`SV.Q5\` **— ¿Cuál es la invitación al server?**
> La invitación al servidor está en la biografía de Jeffrey Bot, y en la descripción del último vídeo de Jeffrey. Ah, y aquí: https://discord.gg/fJvVgkN.`)
        .defColor(Colores.verdeclaro);

    // JEFFREY
    let faqEmbed4 = new Embed()
        .defAuthor({ text: "JeffreyG", icon: Bases.pngs.JeffreyIcon })
        .defDesc(`\`JG.Q1\` **— ¿Por qué [JeffreyG](https://youtube.com/JeffreyG) no sube videos?**
> Por razones personales y por falta de ideas que tiene sobre el canal, además de que es tonto. Si tienes <@&529275759521431553> podrás ver los vídeos antes de tiempo, y a veces, algún adelanto. Mira <#485191307346837507>.

\`JG.Q2\` **— ¿Dónde está el GDPS de JeffreyG?** o **¿Dónde descargo el GDPS?**
> Lamento comunicar que el GDPS ya no se encuentra entre nosotros, y no se podrá descargar ni jugar.

\`JG.Q3\` **— ¿Y el canal de ayuda de GDPS?**
> Con el vídeo tutorial del GDPS de Jeffrey oculto, no seguiría siendo necesario este canal en el servidor.`)
        .defColor(Colores.verdejeffrey)


    // NIVELES
    let niveles = importImage("niveles");
    let lvlEmbed1 = new Embed()
        .setImage(niveles.attachment)
        .defColor(Colores.verdejeffrey);

    let lvlEmbed2 = new Embed()
        .defDesc(`<@&${Config.lvl1}>
• Puedes colorear tu nombre en <#524647331551772672>.
• Adjuntar archivos y links.
• Agregar reacciones a los mensajes.
• Crear nuevos hilos.
• Usar Stickers exteriores.

<@&${Config.lvl10}>
• Cambiarse el apodo.
• Posibilidad de conseguir un 15% más de EXP y Jeffros.
• Compartir pantalla, o stremear un juego en los chat de voz.

<@&${Config.lvl20}>
• 15% de descuento en la tienda (\`/shop\`).

<@&${Config.lvl30}>
• Bono de **${Emojis.Jeffros}2.000**.

<@&${Config.lvl40}>
• Cooldown para conseguir Jeffros y EXP reducido a la mitad. (\`30s\`)

<@&${Config.lvl50}>
• Posibilidad de conseguir un 50% más de EXP y Jeffros.
• Colores nuevos desbloqueados en <#552580632266407957>.

<@&${Config.lvl60}>
• Cooldown para usar el comando \`/coins\` reducido a la mitad. (\`5m\`)
• Bono de **${Emojis.Jeffros}5.000**.

<@&${Config.lvl70}>
• Posibilidad de conseguir un 70% más de EXP y Jeffros.
• Cooldown para conseguir Jeffros y EXP reducido a la cuarta parte. (\`15s\`).

<@&${Config.lvl80}>
• Puedes crear invitaciones nuevas al server.
• Bono de **${Emojis.Jeffros}6.000**.

<@&${Config.lvl90}>
• Bono de **${Emojis.Jeffros}10.000**.
Cooldown para conseguir Jeffros y EXP reducido a la octava parte. (\`7.5s\`).

<@&${Config.lvl99}>
• VIP Desbloqueado.
• Cooldown para usar el comando \`/coins\` reducido a la cuarta parte. (\`2.5m\`).

<@&${Config.lvl100}>
• Rol personalizado (nombre + color personalizado).`)
        .defColor(Colores.verde);

    // CANALES
    let canales = importImage("canales");
    let canalesEmbed = new Embed()
        .setImage(canales.attachment)
        .defColor(Colores.verdejeffrey);

    let canalesEmbed2 = new Embed()
        .defAuthor({ text: `— Información de los canales del servidor`, title: true })
        .defDesc(`**—** A continuación se explicarán la mayoría de los canales por categorías del servidor y sus respectivas funciones.
**—** Para información más específica, algunos canales tienen información en sus respectivas descripciones.
**—** Algunos de los canales no explicados aquí son canales ocultos que sólo aquellos que los desbloqueen podrán verlos.`)
        .defColor(Colores.verdeclaro)

    let global = importImage("global"); // chapter one
    let chapterone = new Embed()
        .setImage(global.attachment)
        .defColor(Colores.verdejeffrey);

    let canalesEmbed3 = new Embed()
        .defDesc(`${rulesChannel} • Las reglas del servidor, si hablas en el chat aseguras haberlas leído.

${infoChannel} • Información general de todo el servidor, aquí pueden resolverse varias dudas que puedas tener.

${newsChannel} • En este canal se harán anuncios a cerca del servidor de discord en su mayoría.

${faqChannel} • En este canal se responden algunas de las preguntas que se hacen al staff con mayor frecuencia.

${hallOfFameChannel} • Aquí se publican los mensajes que han sido destacados por medio de los **Awards**.

<#548968993034338304> • Aquí se envían capturas de eventos memorables que ocurren en el servidor.

<#524647331551772672> • Aquí puedes elegir tu color para tu nombre dentro del server.

<#552580632266407957> • Aquí se encontrarán más colores para aquellos que tengan permisos de verlos.

<#447813323149410304> • Puedes recibir opcionalmente notificaciones de las redes sociales de Jeffrey en este canal
➟ Consíguelo en <#473627930396852226>.`)
        .defColor(Colores.verde);

    let generales = importImage("generales");
    let surface = new Embed()
        .setImage(generales.attachment)
        .defColor(Colores.verdejeffrey);

    let canalesEmbed4 = new Embed()
        .defDesc(`${mainChannel} • Este es canal general, aquí puedes hablar con los demás usuarios del servidor de cualquier tema.

${supportChannel} • Si tienes problemas, dudas, quejas, sugerencias del servidor este es lugar para pedir soporte.

<#485192397228081162> • Canal en donde debes usar los bots del servidor.

<#821486638768455700> • En este canal puedes hablar fuera de contexto, o hacer spam, **no se permite el flood**.

<#485192438701359135> • Aquí se puede hacer tanto SPAM como FLOOD, siendo este último el principal y el único sitio donde puede hacerse.`)
        .defColor(Colores.verdeclaro);

    let bots = importImage("bots");
    let arcade = new Embed()
        .setImage(bots.attachment)
        .defColor(Colores.verdejeffrey);

    let canalesEmbed5 = new Embed()
        .defDesc(`<#564971690304602113> • <@!467377486141980682> Cuenta con los demás usuarios del sevidor, ¿hasta dónde podrán llegar?

<#723304597191393301> • <@520282851925688321> ¡Simulador de minería de minecraft en el servidor!

<#820002227958841344> • <@715906723982082139> Puedes jugar un juego de trivia con todos los miembros del servidor.

<#883160875693916180> • <@356065937318871041> ¿Recuerdas a Akinator? Bueno, ahora puedes jugar con él aquí mismo... ¡en Discord!`)
        .defColor(Colores.verde);

    // ROLES

    let roles = importImage("roles");
    let rolesEmbed = new Embed()
        .setImage(roles.attachment)
        .defColor(Colores.verdejeffrey);

    let rolesEmbed2 = new Embed()
        .defAuthor({ text: `<:Users:494281768883716096> — Roles básicos y especiales`, title: true })
        .setDescription(`\`➟\` Los roles básicos se obtienen sin esfuerzo alguno. Y no tienen mucha influencia a la hora de estar en el server.

\`➟\` Y por el contrario, los roles especiales, tienen cierto impacto en el server. Estos también tienen más dificultad para conseguirlos.`)
        .defColor(Colores.verdeclaro);

    let basicos = importImage("rbasicos");
    let rolesbasicos = new Embed()
        .setImage(basicos.attachment)
        .defColor(Colores.verdejeffrey);

    let rolesEmbed3 = new Embed()
        .defDesc(`<@&460966148704436235> • Todos aquellos que hayan aceptado las reglas tendrán este rol.

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
        .defColor(Colores.verde);

    let especiales = importImage("respeciales");
    let rolesespeciales = new Embed()
        .setImage(especiales.attachment)
        .defColor(Colores.verdejeffrey);

    let rolesEmbed4 = new Embed()
        .defDesc(`<@&595022419123634228> • Alguien que está boosteando el servidor, aparecerá en la lista de miembros por encima de todos menos del Staff.

<@&529275759521431553> • Usuario que ha ascendido en el servidor, tendrá colores exclusivos y acceso anticipado a las notificaciones de Jeffrey, etc.
➟ Si quieres conseguirlo antes de <@&${Config.lvl99}> ve a \`/shop\`.

<@&461259197368107020> • Personas las cuales tienen algún tipo de relación IRL con Jeffrey o/

<@&460586399981109278> • Gente activa con más de 5.000 mensajes en ${mainChannel}.

<@&460517579941740544> • Personas que lleva mucho tiempo dentro del servidor, o está desde tiempos inmemorables, o simplemente estaba en el servidor viejo (...) este rol es muy extraño.`)
        .defColor(Colores.verdeclaro);

    // JEFFROS

    let jeffros = importImage("jeffros");
    let jeffrosEmbed = new Embed()
        .setImage(jeffros.attachment)
        .defColor(Colores.verdejeffrey);

    let jeffrosEmbed2 = new Embed()
        .defDesc(`**—** ¿Qué son los ${Emojis.Jeffros}effros y como conseguirlos?
➟ Los Jeffros son la moneda virtual del servidor. Puedes conseguirlos al hablar en ${mainChannel}.

**—** ¿Cómo gasto mis Jeffros?
➟ Los Jeffros se usarán para comprar items en la tienda del servidor (\`/shop\`) y usar los **Awards**.

**—** No confundir con los __Dark${Emojis.DarkJeffros}effros__:
➟ Los DarkJeffros se desbloquearán cuando un usuario consiga el nivel 5. Podrán ser usados en la DarkShop.

**—** ¿Como consigo DarkJeffros?
➟ Piensa en los DarkJeffros como si fuesen bitcoins... ¿Por qué bitcoins? Porque es divertido.
➟ Los DarkJeffros solo se podrán conseguir cambiando Jeffros. Estos pueden ser más costosos dependiendo de la **inflación actual**.
➟ Usando el comando \`/ayuda\` podrás tener más información en la categoría DarkShop de los comandos disponibles.`)
        .defColor(Colores.verde);

    // STAFF
    let staff = importImage("staff");
    let staffEmbed = new Embed()
        .setImage(staff.attachment)
        .defColor(Colores.verdejeffrey);

    let sentinels = importImage("sentinels")
    let guardians = importImage("guardians")
    let staffEmbed2 = new Embed()
        .setImage(sentinels.attachment)
        .defColor(Colores.verdeclaro);

    let staffEmbed3 = new Embed()
        .setImage(guardians.attachment)
        .defColor(Colores.verdeclaro);

    let staffEmbed4 = new Embed()
        .defDesc(`${staffRoles.toJSON().join(", ")} • Todo aquel que tenga este rol, es parte del equipo del STAFF.

${adminRoles.toJSON().join(", ")} • ${modRole}.

➟ ${jeffreyRole} • Es el rol de JeffreyG. Ten por seguro que si alguien tiene este rol es porque es el verdadero Jeffrey.

➟ Usando el comando \`/serverinfo\` podrás ver quiénes hacen parte del equipo del Staff más cómodamente.`)
        .defColor(Colores.verde);

    // AWARDS
    let silver = interaction.guild.emojis.cache.find(x => x.id === Config.silverAward);
    let gold = interaction.guild.emojis.cache.find(x => x.id === Config.goldAward);
    let platinium = interaction.guild.emojis.cache.find(x => x.id === Config.platiniumAward);

    silver = silver ?? "SILVER EMOTE";
    gold = gold ?? "GOLD EMOTE";
    platinium = platinium ?? "PLAT EMOTE";

    let awards = importImage("awards");
    let awardsEmbed = new Embed()
        .setImage(awards.attachment)
        .defColor(Colores.verdejeffrey);

    let awardsEmbed2 = new Embed()
        .defDesc(`**—** ¿Qué son los Awards?
**➟** Los Awards, como su nombre lo dice traducido al español, son una serie de premios que se muestran en un mensaje.

**—** ¿Como le doy un premio a un mensaje?
**➟** Para dar un Award, es tan fácil como reaccionar al mensaje que quieres darle el premio, con el premio deseado.`)
        .defFooter({ text: `Idea de los Awards tomada de REDDIT.`, icon: "https://www.redditinc.com/assets/images/site/reddit-logo.png" })
        .setColor(Colores.verdeclaro);

    let awardsEmbed3 = new Embed()
        .defDesc(`**${silver} Plata** • Cuesta **${Emojis.Jeffros}100**, se envía el mensaje a <#${Config.hallChannel}> y ya está.

**${gold} Oro** • Cuesta **${Emojis.Jeffros}500**, se envía el mensaje a <#${Config.hallChannel}>, se le da **${Emojis.Jeffros}100** al autor del mensaje premiado.

**${platinium} Platino** • Cuesta **${Emojis.Jeffros}1.800**, se envía el mensaje a <#${Config.hallChannel}>, se le da __**${Emojis.Jeffros}700**__ al autor del mensaje premiado.`)
        .defColor(Colores.verde);

    // DARKSHOP
    let darkshop = new Embed()
        .setImage("https://cdn.discordapp.com/attachments/464810032081666048/836365066864558091/DarkShop.png")
        .defColor(Colores.negro);

    let items = new Embed()
        .setImage("https://cdn.discordapp.com/attachments/464810032081666048/836362815710429224/Items.png")
        .defColor(Colores.negro);

    let inflacion = new Embed()
        .setImage("https://cdn.discordapp.com/attachments/464810032081666048/836364066578497546/Inflacion.png")
        .defColor(Colores.negro);

    let eventos = new Embed()
        .setImage("https://cdn.discordapp.com/attachments/464810032081666048/836368266938810398/Eventos.png")
        .defColor(Colores.negro);

    let inversiones = new Embed()
        .setImage("https://cdn.discordapp.com/attachments/464810032081666048/836369259101028402/Inversiones.png")
        .defColor(Colores.negro);

    let darkshopInformation1 = new Embed()
        .defAuthor({ text: `Lo básico:`, icon: Config.darkLogoPng })
        .defDesc(`**—** Bienvenid@ a la DarkShop.
**—** Con esta guía podrás entender básicamente todo acerca de esta nueva tienda dentro del servidor.
**—** Lo básico vendría siendo los comandos dentro de la tienda, los cuales puedes ver usando \`/ds ayuda\`, cuando los hayas visto, vuelve aquí.`)
        .defColor(Colores.negro);

    let darkshopInformation2 = new Embed()
        .defAuthor({ text: `Los items:`, icon: Config.darkLogoPng })
        .defDesc(`Esta nueva tienda tiene items principalmente que afectan a otros usuarios, **temporalmente, claro**.
Y así como tú mismo puedes ser quien lo origine, también puedes ser perjudicado. Esto puede ser evitado, y es comprando el **Item #1, el __Firewall__**.
Con este item, cualquier otro item que tenga un **efecto negativo** sobre quien se use, __será anulado__. **A no ser...**
Cuando cambias tus primeros ${Emojis.Jeffros}Jeffros por ${Emojis.DarkJeffros}DarkJeffros, se creará aleatoriamente un porcentaje (1% - ~15%) llamado **Precisión**.

**— ¿Qué significa el porcentaje de la Precisión?**
El porcentaje que se le da a un usuario al cambiar sus primeros Jeffros por DarkJeffros... larga historia corta, es la probabilidad que tiene alguien de saltarse el **Firewall** de un usuario y así afectarlo con un item.`)
        .defColor(Colores.negro)

    let darkshopInformation3 = new Embed()
        .defAuthor({ text: `¿Cómo funciona la inflación?`, icon: Config.darkLogoPng })
        .defDesc(`Lo mágico de la DarkShop es la inflación. Esta es global, la misma para todos los usuarios, y esta va del 0.01% al 10%.
La forma de determinar el precio actual de **${Emojis.DarkJeffros}1** es: **${Emojis.Jeffros}200 x <inflación>**, haciendo así que **${Emojis.DarkJeffros}1** pueda costar **${Emojis.Jeffros}2** hasta **${Emojis.Jeffros}2.000**.
La inflación dura un plazo máximo de **${Config.daysNormalInflation} días** y se genera de forma aleatoria. **SIN EMBARGO...**`)
        .defColor(Colores.negro);

    let darkshopInformation4 = new Embed()
        .defAuthor({ text: `Los eventos:`, icon: Config.darkLogoPng })
        .defDesc(`A partir de aquí empieza a ponerse interesante la cosa: dentro de un periodo de inflación puede haber, **o no** eventos con la inflación.
La inflación puede subir, bajar o quedarse igual en un momento indeterminado.
Pero... ¿cómo que interesante? ... ¿por qué? Ahora se viene el plot twist.`)
        .defColor(Colores.negro);

    let darkshopInformation5 = new Embed()
        .defAuthor({ text: `Inversiones:`, icon: Config.darkLogoPng })
        .defDesc(`Ahhh, las inversiones. Debido a la inflación, puedes llegar incluso a comprar ${Emojis.DarkJeffros}100 por **${Emojis.Jeffros}200** que esos mismos ${Emojis.DarkJeffros}100 cuesten **${Emojis.Jeffros}200.000**.
Bastante increíble, aunque este es sólo un escenario, que es muy poco probable, puede llegar a pasar. Así como puedes ganar, también puedes perder. Nunca olvides la duración de tus DarkJeffros.
Ten cuidado, aquellos que tengan **${Emojis.Jeffros}20.000** o más; deberán pagar un interés, el cuál es detallado en <#${Config.infoChannel}>, así que ten eso en cuenta.

**— La duración de los ${Emojis.DarkJeffros}DarkJeffros:**
Cuando un usuario cambia sus Jeffros por DarkJeffros, su cuenta en esta tienda se verá comprometida por las autoridades del servidor, por esto, la misma tienda se encargará que a un plazo aleatorio todos los DarkJeffros que tengas en tu cuenta sean borrados para evitar problemas.
Este plazo será definido por: \`La duración oculta de la inflación actual + 1 a ${Config.daysDarkJeffros} días adicionales\`.
Puedes ver este plazo con \`/ds duration\`. Si no cambias tus DarkJeffros a Jeffros antes de este plazo, los perderás.`)
        .defColor(Colores.negro);

    // MANUAL
    let manualEmbed = new Embed()
        .defColor(Colores.nocolor)
        .defDesc(`Bienvenid@ al Staff. ¿O simplemente estás aquí para aclarar dudas? Pues bienvenid@ seas, también.
Ya supongo que sabes que función cumple cada rol de Staff. Sino, [pulsa acá](https://discordapp.com/channels/447797737216278528/485191307346837507/668568044146130959).

En este manual se mostrarán las instrucciones a la hora de hacer ciertas acciones en el servidor. Este manual se actualizará cuando sea necesario, y cuando se haga se dirá en <#525068953500778518>.`)

    let manualEmbed2 = new Embed()
        .defColor(Colores.verde)
        .setImage(EmbedImages.warns);

    let manualEmbed3 = new Embed()
        .defColor(Colores.nocolor)
        .defDesc(`Lo más importante del staff diría yo.
Aunque creo que es obvio tengo que aclarar que usará a ${client.user} para la moderación del servidor. Puedes ver tus comandos con \`/ayuda\`.

<:Faq:494282181296914432> **— ¿Cuando dar un warn y cuando no?**
Es sencillo. Cuando un usario incumpla una regla hay que tener en cuenta una sóla cosa:
**¿Se le ha advertido de forma textual en el chat con anterioridad, y a su vez se le ha dado un softwarn?**
> "Sí": Procede con el warn.
> "No": Adviertele por medio del chat, **y luego softwarneal@**. Si continúa pues métele un warn entre pecho y espalda.

Si la falta es grave (Cosas irreversibles: como publicar información/imágenes que afecten a un usuario sin necesidad de nada más), proceder con un castigo.
Puedes optar por un warn o de acuerdo a la situación, usar otros comandos de moderación.`);

    let manualEmbed4 = new Embed()
        .defColor(Colores.verde)
        .setImage(EmbedImages.req);

    let manualEmbed5 = new Embed()
        .defColor(Colores.nocolor)
        .defAuthor({ text: "Requisitos para mantenerte como staff", title: true })
        .defDesc(`*Si eres staff antiguo, quizá quieras saltarte esto.*

Para mantener tu posición como staff, debes cumplir lo siguiente:
> ➟ No abusar de tu poder.
> ➟ Sé activo en el servidor. (No debes vivir dentro del servidor, pero tú me entiendes.)
> ➟ No des roles de staff y roles en general **(si no lo merecen)** a usuarios/amigos.
> ➟ Si tienes alguna duda, no lo pienses dos veces y pregunta en <#485191724369444865>.

Y la más importante:
> ➟ No te tomes esto como lo más serio de mundo. Todos estamos aquí para divertirnos, ¿verdad? relájate un poco.`);

    let finalInfoEmbed = new Embed()
        .defColor(Colores.verde)
        .defDesc(`**— Y... ¡eso es todo!**
• Esperamos te la pases bien en el server, si tienes dudas del server no dudes preguntar en ${supportChannel} y no olvides leer las ${rulesChannel}.`)

    let colores = importImage("colores");

    let imgColoresEmbed = new Embed()
        .setImage(colores.attachment)
        .defColor(Colores.verde);

    let coloresEmbed = new Embed()
        .defDesc(`<:Colores:494280433765449733> **—** Aquí tienes variedad de 10 colores. ¡Con sólo reaccionar se te será asignado!`)
        .defColor(Colores.nocolor);

    let ecolores = importImage("coloresespeciales");
    let imgEColoresEmbed = new Embed()
        .setImage(ecolores.attachment)
        .defColor(Colores.verde);

    let eColoresEmbed = new Embed()
        .defDesc(`<:Colores:494280433765449733> **—** Más colores para gente con suerte ${shrug}.`)
        .defColor(Colores.nocolor);

    let reglas = importImage("reglas");

    let imgReglasEmbed = new Embed()
        .setImage(reglas.attachment)
        .defColor(Colores.verdejeffrey);

    let reglasEmbed = new Embed()
        .setDescription(`**Regla N°1**: Intentemos mantener el chat con un grado de **Sentido Común**, no nos alejemos tanto de él: evita el uso **EXCESIVO** de cadenas, shitposts, comentarios sin sentido y/o fuera de lugar. Puedes ignorar esta regla completamente en <#821486638768455700>.

**Regla N°2**: Trata a las personas con las que no tienes tanta confianza con **respeto y amabilidad**. No menciones innecesariamente. No gore ni contenido que pueda herir la sensibilidad de los demás **(NO NSFW)**.

**Regla N°3**: Cada canal tiene un fin, **escribe dónde debas hacerlo**. Siempre lee las descripciones de los canales.

**Regla N°4**: **No flood ni spam** en los canales generales.

**Regla N°5**: No nicknames inapropiados ni con símbolos que no te dejen mencionarlos ni que cambien drásticamente tu posición en la lista de miembros.

**Regla N°6**: No reclames/quejes en **canales generales**, sobre acciones de moderación hacia tu persona, para ello, próximamente se **implementará** un sistema de tickets donde podras comunicarte con el STAFF directamente.
➟ De mientras, si tienes quejas usa <#839861097770123334>.

**Regla N°7**: Nada de usar "vacíos legales", sigue las reglas y ya está. Esto incluye el intentar tomar ventajas por deliberadamente con bugs/erróres.

**Regla N°8**: __**Debes**__ cumplir las [Condiciones del servicio de Discord "TOS"](https://discord.com/terms) y sus [Directivas de la comunidad](https://discord.com/guidelines).

\`—\` Un dato curioso: ${client.user} te enviará un mensaje al recibir cualquier tipo de warn, siempre y cuando tengas los MDs activados.
Esto no es obligatorio, siempre puedes usar el comando \`/warns\` para conocer __tus__ warns.`)
        .defColor(Colores.verde);

    let reglasFooterEmbed = new Embed()
        .defFooter({ text: `— ¡Gracias por leer! | Al hablar en el chat aseguras que has leído las reglas del servidor y que las cumplirás.`, icon: interaction.guild.iconURL({ dynamic: true }) })
        .defColor(Colores.verdeclaro);

    let autoroles = importImage("autoroles");
    let imgAutoEmbed = new Embed()
        .setImage(autoroles.attachment)
        .defColor(Colores.verde);

    let autoEmbed = new Embed()
        .defDesc(`**—** Reacciona de acuerdo a los roles que quieras tener.

🔔 ➟ <@&${Config.teamcampanita}>
🤖 ➟ <@&${Config.jbnews}>`)
        .defColor(Colores.nocolor);

    let muted = importImage("muted");
    let imgMutedEmbed = new Embed()
        .setImage(muted.attachment)
        .defColor("#2C2F33");

    let mutedEmbed = new Embed()
        .defDesc(`**—** Haz sido muteado, ten la esperanza de que en algún momento serás desmuteado, **Stay Determined! <:determined:572982380852412436>**`)
        .defColor(Colores.nocolor);

    let viproles = importImage("rolesvip");
    let imgVipRolesEmbed = new Embed()
        .setImage(viproles.attachment)
        .defColor(Colores.verde);

    let vipRolesEmbed = new Embed()
        .defDesc(`**—**Como eres <@&529275759521431553>, tienes más roles **exclusivos** disponibles. Reacciona de acuerdo a los roles que quieras tener.

🌠 ➟ <@&564144046591705089>
📸 ➟ <@&909980351953268736>`)
        .defColor(Colores.nocolor);

    let ticketEmbed = new Embed()
        .defAuthor({ text: "NUEVO TICKET", title: true })
        .defDesc("¿Necesitas ayuda? ¿Alguna duda? ¿Warn injusto?\nPulsa el botón de aquí abajo para crear un ticket para hablar directamente con el STAFF.")
        .defColor(Colores.verdeclaro);

    let ticketRow = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId("createTicket")
                .setLabel("CREAR TICKET")
                .setStyle(ButtonStyle.Success)
                .setEmoji("🎫")
        );

    let query = await lastMsgsByMe(interaction.channel);
    const last = query[0];
    const lastMsgs = query[1];

    switch (embed) {
        case "faq":
            await interaction.channel.send({ embeds: [faqEmbedIntro, faqEmbedIntro2], files: [faq.file] })
            await interaction.channel.send({ embeds: [faqEmbed2] })
            await interaction.channel.send({ embeds: [faqEmbed3] })
            await interaction.channel.send({ embeds: [faqEmbed4] })
            break;

        case "información":
            //niveles
            await interaction.channel.send({ embeds: [lvlEmbed1, lvlEmbed2], files: [niveles.file] });
            //canales
            await interaction.channel.send({ embeds: [canalesEmbed, canalesEmbed2, chapterone, canalesEmbed3, surface, canalesEmbed4, arcade, canalesEmbed5], files: [canales.file, global.file, generales.file, bots.file] });
            //roles
            await interaction.channel.send({ embeds: [rolesEmbed, rolesEmbed2, rolesbasicos, rolesEmbed3, rolesespeciales, rolesEmbed4], files: [roles.file, basicos.file, especiales.file] });
            //jeffros
            await interaction.channel.send({ embeds: [jeffrosEmbed, jeffrosEmbed2], files: [jeffros.file] });
            //awards
            await interaction.channel.send({ embeds: [awardsEmbed, awardsEmbed2, awardsEmbed3], files: [awards.file] });
            //staff
            await interaction.channel.send({ embeds: [staffEmbed, staffEmbed2, staffEmbed3, staffEmbed4], files: [staff.file, sentinels.file, guardians.file] });
            //final
            await interaction.channel.send({ embeds: [finalInfoEmbed] });
            break;

        case "colores":
            if (last) {
                editLastMsgs(lastMsgs, coloresEmbed);
            } else {
                await interaction.channel.send({ embeds: [imgColoresEmbed], files: [colores.file] });
                await interaction.channel.send({ embeds: [coloresEmbed] });
            }
            break;

        case "colores especiales":
            if (last) {
                editLastMsgs(lastMsgs, eColoresEmbed);
            } else {
                await interaction.channel.send({ embeds: [imgEColoresEmbed], files: [ecolores.file] });
                await interaction.channel.send({ embeds: [eColoresEmbed] });
            }

            break;

        case "reglas":
            await interaction.channel.send({ embeds: [imgReglasEmbed, reglasEmbed, reglasFooterEmbed], files: [reglas.file] });
            break;

        case "auto roles":
            if (last) {
                editLastMsgs(lastMsgs, embed2);
            } else {
                await interaction.channel.send({ embeds: [imgAutoEmbed], files: [autoroles.file] });
                await interaction.channel.send({ embeds: [autoEmbed] });
            }

            break;

        case "muted":
            await interaction.channel.send({ embeds: [imgMutedEmbed], files: [muted.file] })
            await interaction.channel.send({ embeds: [mutedEmbed] });

            break;

        case "vip roles":
            if (last) {
                editLastMsgs(lastMsgs, embed2);
            } else {
                await interaction.channel.send({ embeds: [imgVipRolesEmbed], files: [viproles.file] });
                await interaction.channel.send({ embeds: [vipRolesEmbed] });
            }

            break;

        case "staff manual":
            await interaction.channel.send({ embeds: [staffEmbed, manualEmbed, manualEmbed2, manualEmbed3, manualEmbed4, manualEmbed5] });
            break;

        case "darkshop info":
            await interaction.channel.send({ embeds: [darkshop, darkshopInformation1, items, darkshopInformation2, inflacion, darkshopInformation3, eventos, darkshopInformation4, inversiones, darkshopInformation5] })
            break;

        case "ticket":
            await interaction.channel.send({ embeds: [ticketEmbed], components: [ticketRow] });
            break;
    }

    return interaction.editReply({
        content: null, embeds: [
            new Embed({
                type: "success"
            })
        ]
    });

    async function lastMsgsByMe(channel) {
        let msgs = await channel.messages.fetch({ limit: 2 });
        return [(msgs.every(x => x.author.id === client.user.id) && msgs.size != 0) ?? false, msgs];
    }

    async function editLastMsgs(msgs, embed2) {
        if (msgs.size === 2) {
            msgs.forEach(msg => {
                if (msg.reactions.cache.size != 0) return msg.edit({ embeds: [embed2] });
            })
        } else if (msgs.size === 1) {
            return interaction.channel.send("No puedo hacer eso D:");
        }
    }
}

module.exports = command;