const { ButtonStyle, ButtonBuilder, ActionRowBuilder, time } = require("discord.js");
const { Command, Embed, importImage } = require("../../utils");
const { Colores, Bases } = require("../../resources");

const command = new Command({
    name: "dev-embeds",
    desc: "Enviar embeds defaults para el servidor de JeffreyG"
})

command.addOption({
    type: "string",
    name: "embed",
    desc: "Embed a mostrar",
    req: true,
    choices: ["Información", "Faq", "Reglas", "Colores", "Colores especiales", "Auto Roles", "Vip Roles", "Staff Manual", "Vip Info", "DarkShop Info", "Ticket Info", "Cumple Info", "Ticket"]
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const { Emojis, EmojisObject } = client;

    const embed = params.embed.value;
    const doc = params.getDoc();

    // Variables
    let adminRolesDb = doc.getAdmins();
    let staffRolesDb = doc.getStaffs();

    let jeffreyRole = interaction.guild.roles.cache.get(Bases.owner.roles.jeffreyRole);
    let modRole = interaction.guild.roles.cache.get(Bases.owner.roles.modRole);
    let vipRole = interaction.guild.roles.cache.get(Bases.owner.roles.vipRole);

    let adminRoles = interaction.guild.roles.cache.filter(role => {
        return adminRolesDb.find(savedId => savedId === role.id)
    });
    let staffRoles = interaction.guild.roles.cache.filter(role => {
        return staffRolesDb.find(savedId => savedId === role.id)
    });

    let mainChannel = Bases.owner.channels.mainChannel;
    let rulesChannel = interaction.guild.channels.cache.get(doc.getChannel("general.rules"));
    let newsChannel = interaction.guild.channels.cache.get(doc.getChannel("general.announcements"));
    let infoChannel = interaction.guild.channels.cache.get(doc.getChannel("general.information"));
    let dsNewsChannel = interaction.guild.channels.cache.get(doc.getChannel("logs.darkshop_logs"));
    let sugsChannel = interaction.guild.channels.cache.get(doc.getChannel("logs.suggestions"));
    let faqChannel = interaction.guild.channels.cache.get(doc.getChannel("general.faq"));
    let hallOfFameChannel = interaction.guild.channels.cache.get(doc.getChannel("general.halloffame"));

    let ytChannel = interaction.guild.channels.cache.get(doc.getChannel("notifier.youtube_notif"));
    let tvChannel = interaction.guild.channels.cache.get(doc.getChannel("notifier.twitch_notif"));

    switch (embed) {
        case "faq":
            let faq = importImage("preguntas");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(faq.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .defTitle(`— Preguntas más frecuentes`)
                        .defThumbnail(client.EmojisObject.Thinking.url)
                        .defDesc(`➟ Como puedes imaginar, veremos las preguntas frecuentes que se hacen en este servidor. Se irán actualizando a medida que hayan más preguntas frecuentes :)`)
                        .defColor(Colores.verde)
                ], files: [faq.file]
            })
            await interaction.channel.send({ embeds: [new Embed().defTitle("DarkShop").defColor(Colores.negro)] });
            await interaction.channel.send({ embeds: [new Embed().defTitle("Server").defColor(Colores.verde)] });
            await interaction.channel.send({ embeds: [new Embed().defTitle("Jeffrey").defColor(Colores.verdejeffrey)] });
            break;

        case "información":
            // bienvenida
            let saludo = importImage("hola");
            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defImage(saludo.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .defTitle("¡Bienvenid@ al servidor de JeffreyG!")
                        .defDesc(`**—** Mira la información a continuación y las <#523159573935423509> antes de empezar tu viaje en el servidor.\n
**Invitación al servidor:**
> ${Emojis.Badge} • https://discord.gg/fJvVgkN

**Y aquí están las redes de Jeffrey**:
> ${Emojis.YouTube} • https://www.youtube.com/@JeffreyG
> ${Emojis.Twitch} • https://twitch.tv/JeffreyG_
> ${Emojis.Twitter} • https://www.twitter.com/eljeffrowo`)
                        .defColor(Colores.verdeclaro)
                ], files: [saludo.file]
            });

            // niveles
            let niveles = importImage("niveles");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(niveles.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .defDesc(`<@&${Bases.owner.roles.levels.lvl1}>
• Puedes colorear tu nombre en <#524647331551772672>.
• Adjuntar archivos y links.
• Usar Stickers exteriores.
• Agregar reacciones a los mensajes.
• Crear nuevos hilos.
        
<@&${Bases.owner.roles.levels.lvl10}>
• Cambiarse el apodo.
• Posibilidad de conseguir un **15%** más de **EXP** y **Jeffros**.
• Compartir pantalla, o stremear un juego en los chat de voz.
• Usar la Soundboard.

<@&${Bases.owner.roles.levels.lvl20}>
• **15% de descuento** en la tienda (\`/shop\`).

<@&${Bases.owner.roles.levels.lvl30}>
• Bono de **${Emojis.Jeffros}2.000**. Avísale al STAFF :)

<@&${Bases.owner.roles.levels.lvl40}>
• Cooldown para conseguir **Jeffros** y **EXP** reducido a la mitad. (\`30s\`)

<@&${Bases.owner.roles.levels.lvl50}>
• Posibilidad de conseguir un **50%** más de **EXP** y **Jeffros**.
• Colores nuevos desbloqueados en <#552580632266407957>.

<@&${Bases.owner.roles.levels.lvl60}>
• Cooldown para usar el comando \`/coins\` reducido a la mitad. (\`5m\`)
• Bono de **${Emojis.Jeffros}5.000**. Avísale al STAFF :)

<@&${Bases.owner.roles.levels.lvl70}>
• Posibilidad de conseguir un **70%** más de **EXP** y **Jeffros**.
• Cooldown para conseguir **Jeffros** y **EXP** reducido a la cuarta parte. (\`15s\`).

<@&${Bases.owner.roles.levels.lvl80}>
• Puedes crear **invitaciones nuevas** al server.
• **25% de descuento** en la tienda (\`/shop\`).
• Bono de **${Emojis.Jeffros}6.000**. Avísale al STAFF :)

<@&${Bases.owner.roles.levels.lvl90}>
• Bono de **${Emojis.Jeffros}10.000**. Avísale al STAFF :)
• Cooldown para conseguir **Jeffros** y **EXP** reducido a la octava parte. (\`7.5s\`).

<@&${Bases.owner.roles.levels.lvl99}>
• **VIP** Desbloqueado.
• Cooldown para usar el comando \`/coins\` reducido a la cuarta parte. (\`2.5m\`).

<@&${Bases.owner.roles.levels.lvl100}>
• Cuando se abra la beta de Jeffrey Bot público, serás uno de los tomados en cuenta.
• Rol personalizado **(nombre + color personalizado)**.`)
                        .defColor(Colores.verde)
                ], files: [niveles.file]
            });

            // categorias
            let canales = importImage("categorias");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(canales.attachment)
                        .defColor(Colores.verdejeffrey),

                    new Embed()
                        .defTitle(`— A continuación se explicarán las categorías dentro del servidor y sus canales:`)
                        .defFooter({ text: "Recuerda siempre leer las descripciones de los canales!", icon: interaction.guild.iconURL() })
                        .defColor(Colores.verdeclaro),

                    new Embed()
                        .defTitle(`<#485190940638838804> • Categoría que reúne toda la información básica del servidor`)
                        .defDesc(`${rulesChannel} • Las reglas que debes seguir al usar el servidor.\n
${infoChannel} • Este canal, aquí se encuentra la información del servidor: roles, canales, niveles, etc.\n
<id:customize> • Personaliza los canales que quieres ver, y los roles que desees.\n
<#836397833531818004> • Aquí se explica cómo funciona la DarkShop, cómo usarla y demás.\n
${faqChannel} • Aquí se responden algunas preguntas que se hacen los usuarios al estar en el servidor.`)
                        .defColor(Colores.verde),

                    new Embed()
                        .defTitle(`<#1080191362047148173> • Categoría que reúne todos los canales de anuncios.`)
                        .defDesc(`${newsChannel} • Todos los anuncios hechos hacia todos en el servidor por parte del STAFF.\n
${dsNewsChannel} • Todas las interacciones y sucesos que se dan en la DarkShop.\n
<#495063383528308747> • Si hay un evento en el servidor, todos sus anuncios se harán en este canal.\n
${ytChannel} • Aquí se anuncia la actividad de Jeffrey en YouTube.\n
${tvChannel} • Aquí se anuncia la actividad de Jeffrey en Twitch.`)
                        .defColor(Colores.verde),

                    new Embed()
                        .defTitle(`<#1080191505744015360> • Categoría que reúne todo lo que pasa en la comunidad.`)
                        .defDesc(`${hallOfFameChannel} • Aquí se enviarán los mensajes que los usuarios premien con los “Awards”.\n
${sugsChannel} •  Aquí se enviarán las sugerencias que hagan los usuarios (\`/sug\`), donde los demás pueden reaccionar si están de acuerdo o no, y el STAFF darte una respuesta.\n
<#548968993034338304> • Capturas de pantalla en su mayoría, momentos en el servidor que el STAFF quiere atesorar.\n
<#632362255950020608> • Canal donde se mostrarán los sorteos actuales.`)
                        .defColor(Colores.verde),

                    new Embed()
                        .defTitle(`<#1080191674619277353> • Categoría que reúne los canales para personalizar tu usuario en el server.`)
                        .defDesc(`<#1080197287977959486> • Un canal con la información que necesitas para definir tu cumpleaños en el servidor.\n
<#524647331551772672> • Escoge el color de cómo quieres que se vea tu nombre.\n
<#552580632266407957> • Más colores, pero no públicos para todos.`)
                        .defColor(Colores.verde),

                    new Embed()
                        .defTitle(`<#919010692940570704> • Categoría que reúne la funcionalidad de los tickets.`)
                        .defDesc(`<#1076559856930140202> • Toda la información extra que necesitas saber de los tickets.\n
<#1076559878082011207> • Aquí puedes iniciar un nuevo ticket.`)
                        .defColor(Colores.verde),

                    new Embed()
                        .defTitle(`<#447802508585336843> • Categoría que reúne los canales generales del servidor.`)
                        .defDesc(`<#${mainChannel}> • Canal principal. Puedes hablar aquí con los demás usuarios del servidor.\n
<#485192397228081162> • Si crees que usarás muchos comandos, usa este canal para eso.\n
<#485192438701359135> • Aquí puedes promocionarte, y hacer flood. Libérate.`)
                        .defColor(Colores.verde),

                    new Embed()
                        .defTitle(`<#843166805492760606>`)
                        .defDesc(`— Categoría que reúne todos los bots de diversión y los separa por canales. Para ver información de cada canal, revisa su descripción.`)
                        .defColor(Colores.nocolor),

                    new Embed()
                        .defTitle(`<#1080193420603174992>`)
                        .defDesc(`— Categoría que reúne los archivados del servidor, canales en los que ya no se puede escribir, pero si ver sus recuerdos.`)
                        .defColor(Colores.nocolor),
                ], files: [canales.file]
            });

            // roles
            let basicos = importImage("rbasicos");
            let especiales = importImage("respeciales");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(basicos.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .defTitle(`Se obtienen sin esfuerzo alguno.`)
                        .defDesc(`<@&460966148704436235> • Todos aquellos que hayan aceptado las reglas tendrán este rol.\n
<@&447821238631530498> • Todos los Bots del server tendrán este rol.\n
<@&460242238555815946> <@&1083884414938919012> <@&1083884260991172608> • ¡Suscriptores que quieren recibir notificaciones de **YouTube, Shorts o Twitch** de Jeffrey en Discord!\n
<@&573308631018110986> • Personas dentro del server que quieren estar al tanto de las novedades de Jeffrey Bot.\n
<@&779783625398812673> • Personas que tienen acceso a la DarkShop y desean recibir menciones de eventos de la inflación e información de la DarkShop en general.\n
_**${client.Emojis.Error} Algunos roles se consiguen en la sección <id:customize> arriba del todo.**_`)
                        .defColor(Colores.verde),
                    new Embed()
                        .setImage(especiales.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .defTitle(`Tienen cierto impacto en el server. Es más difícil conseguirlos.`)
                        .defDesc(`<@&595022419123634228> • Alguien que está boosteando el servidor, aparecerá en la lista de miembros por encima de todos menos del STAFF. Tendrán VIP y consigo, sus beneficios mientras sigan boosteando.\n
${vipRole} • Usuario que ha ascendido en el servidor, tendrá colores exclusivos y acceso anticipado a las notificaciones de Jeffrey, etc.
    ➟ Puede ser comprado en la tienda del servidor (\`/shop\`), antes de llegar al <@&${Bases.owner.roles.levels.lvl99}>.\n
<@&461302293464219658> • Personas que se la pasan bien en el servidor y es bueno con los demás.\n
<@&461553370277347328> • Persona de confianza para Jeffrey.\n
<@&508385695929466881> • Persona que ha ayudado al desarrollo de Jeffrey Bot de alguna forma. 💚\n
<@&461259197368107020> • Personas las cuales tienen algún tipo de relación IRL con Jeffrey :saluting_face:\n
<@&460586399981109278> • Gente activa con más de 5.000 mensajes en <#447802627187539968>.\n
<@&460517579941740544> • Personas que lleva mucho tiempo dentro del servidor, o está desde tiempos inmemorables, o simplemente estaba en el servidor viejo (...) este rol es muy extraño.\n`)
                        .defColor(Colores.verdeclaro)
                ], files: [basicos.file, especiales.file]
            });

            // economia
            let economia = importImage("economia");
            let jeffros = importImage("jeffros");
            let awards = importImage("awards");
            let darkjeffros = importImage("darkjeffros");

            let silver = client.Emojis.Tier1;
            let gold = client.Emojis.Tier2;
            let platinium = client.Emojis.Tier3;

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(economia.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .defTitle(`— Hay un sistema de economía en el servidor y así funciona:`)
                        .defColor(Colores.nocolor),
                    new Embed()
                        .setImage(jeffros.attachment)
                        .defColor(Colores.verdeclaro),
                    new Embed()
                        .defTitle(`— ¿Qué son los ${Emojis.Jeffros}Jeffros?`)
                        .defDesc(`➟ Los Jeffros son la moneda ficticia dentro del servidor, se consiguen al hablar en algunos canales, y con algunos comandos de Jeffrey Bot:\n
\`/coins\` • Consigue Jeffros extras en un intervalo de 10 minutos, (o menos).\n
\`/roulette\` • Puedes conseguir Jeffros, boosts o también PERDERLOS.\n
\`/rob\` • Puedes intentar robar Jeffros a otro usuario, pero cuidado, también los puedes perder.`)
                        .defFooter({ text: `Los canales que dan EXP y Jeffros lo dirán en su descripción!`, icon: EmojisObject.Error.url })
                        .defColor(Colores.verde),
                    new Embed()
                        .setImage(awards.attachment)
                        .defColor(Colores.verdeclaro),
                    new Embed()
                        .defTitle(`— ¿Qué son los Awards?`)
                        .defDesc(`➟ Si un mensaje de gusta tanto que quieres darle un premio, puedes hacerlo haciendo click derecho > aplicaciones > Dar Award
➟ En teléfonos es lo mismo, pero manteniendo presionado un mensaje.`)
                        .defColor(Colores.verde),
                    new Embed()
                        .defDesc(`${silver} • Cuesta **${Emojis.Jeffros}100**, se envía el mensaje a ${hallOfFameChannel} y ya está.

${gold} • Cuesta **${Emojis.Jeffros}500**, se envía el mensaje a ${hallOfFameChannel}, se le da **${Emojis.Jeffros}100** al autor del mensaje premiado.

${platinium} • Cuesta **${Emojis.Jeffros}1.800**, se envía el mensaje a ${hallOfFameChannel}, se le da __**${Emojis.Jeffros}700**__ al autor del mensaje premiado.`)
                        .defColor(Colores.verde),
                    new Embed()
                        .setImage(darkjeffros.attachment)
                        .defColor(Colores.verdeclaro),
                    new Embed()
                        .defTitle(`— ¿Qué son los ${Emojis.DarkJeffros}DarkJeffros?`)
                        .defDesc(`➟ Los DarkJeffros son otro tipo de moneda dentro del servidor. Si eres menor de nivel 5 no te interesa, *¿por ahora...?*\n
➟ Imagina a los ${Emojis.DarkJeffros}DarkJeffros como bitcoins. (Porque es divertido)
➟ Estos sólo se pueden conseguir al cambiarlos por ${Emojis.Jeffros}Jeffros.
➟ Toda la información que necesitas está en ${Emojis.DarkShop} <#836397833531818004>.`)
                        .defColor(Colores.verde),
                ], files: [economia.file, jeffros.file, awards.file, darkjeffros.file]
            });

            // staff
            let staff = importImage("staff");

            let sentinels = importImage("admins")
            let guardians = importImage("mods")

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(staff.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .setImage(sentinels.attachment)
                        .defColor(Colores.verdeclaro),
                    new Embed()
                        .setImage(guardians.attachment)
                        .defColor(Colores.verdeclaro),
                    new Embed()
                        .defDesc(`${staffRoles.toJSON().join(", ")} • Todo aquel que tenga este rol, es parte del equipo del STAFF.
        
${adminRoles.toJSON().join(", ")} • ${modRole}.

➟ ${jeffreyRole} • Es el rol de JeffreyG. Ten por seguro que si alguien tiene este rol es porque es el verdadero Jeffrey.

➟ Usando el comando \`/serverinfo\` podrás ver quiénes hacen parte del equipo del STAFF más cómodamente.`)
                        .defColor(Colores.verde)
                ], files: [staff.file, sentinels.file, guardians.file]
            });

            //final
            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defColor(Colores.verde)
                        .defTitle(`Y... ¡eso es todo!`)
                        .defDesc(`• Esperamos te la pases bien en el server, si depués de leer toda la información tienes dudas, puedes preguntar en el chat :D.`)
                ]
            });
            break;

        case "colores":
            let colores = importImage("colores");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(colores.attachment)
                        .defColor(Colores.verde),
                    new Embed()
                        .defDesc(`**—** ¡Mira cuántos colores...! ¡Y con sólo reaccionar aquí abajo puedes colorear tu nombre!
**—** Me pregunto si habrán más...`)
                        .defColor(Colores.nocolor)
                ], files: [colores.file]
            });

            break;

        case "colores especiales":
            let ecolores = importImage("coloresespeciales");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(ecolores.attachment)
                        .defColor(Colores.verde),
                    new Embed()
                        .defDesc(`**—** ¿¡Más colores!? Creo que es tu día de suerte.
**—** Ojalá poder poner mi propio color...`)
                        .defColor(Colores.nocolor)
                ], files: [ecolores.file]
            });

            break;

        case "reglas":
            let reglas = importImage("reglas");

            let regla1 = new Embed()
                .defTitle(`Regla N°1: Mantén un ambiente agradable y con orden, NO hagas Spam, Flood o envíes NSFW.`)
                .defDesc(`\`I.\` Spam será: la promoción de ti mismo o de alguien más, sólo hazlo si este aporta a la conversación.\n
\`II.\` Flood será: muchos mensajes, un solo mensaje que ocupe mucho espacio. **No es** flood enviar una imagen, vídeo o GIF. **Pero sí lo es** enviar muchos seguidos que __no aportan nada a la conversación__.\n
\`III.\` NSFW (Not Safe for Work) será: gore, pornografía, contenido que pueda incomodar a los usuarios, o cualquier contenido que literalmente no pueda ser visto en el trabajo.\n
\`IV.\` Mantener un ambiente agradable será: el buen ambiente de las conversaciones (ej: los temas), y del correcto uso de los canales. Por ejemplo, sería mal visto que los usuarios estén charlando y que empieces a usar muchos comandos en medio.`)
                .defColor(Colores.verde);
            let regla2 = new Embed()
                .defTitle(`Regla N°2: No molestes a los demás usuarios ni siquiera en los mensajes privados. No incomodes faltando el respeto hacia alguien que no tienes confianza.`)
                .defDesc(`\`I.\` Menciona a otros usuarios sólo si es necesario.
\`II.\` Menciona al STAFF en caso de que hayan problemas.`)
                .defFooter({ text: `Básicamente: compórtate como lo harías en la vida real.` })
                .defColor(Colores.verde);
            let regla3 = new Embed()
                .defTitle(`Regla N°3: Con el fin de poder comunicarnos bien, no uses símbolos raros que hagan difícil mencionarte.`)
                .defDesc(`\`I.\` Al unirte, el STAFF podrá cambiarte el apodo dentro del servidor como lo vean correcto: si algo está mal, háznoslo saber.
\`II.\` Si el STAFF cambia tu apodo y lo reestableces, podrás ser sujeto a una sanción.`)
                .defColor(Colores.verde);

            let regla4 = new Embed()
                .defTitle(`Regla N°4: Sigue al STAFF, no existen los vacíos legales, si el STAFF te llama la atención por algo que no está explícito en las reglas, está bien si se tiene una razón de ser.`)
                .defFooter({ text: `Si no cesas en tu actitud, el STAFF puede sancionarte por incumplir esta regla. ` })
                .defColor(Colores.verde);

            let regla5 = new Embed()
                .defTitle(`Regla N°5: Sigue las reglas de Discord y sus directivas de la comunidad.`)
                .defURL("https://discord.com/terms")
                .defColor(Colores.verde);

            let reglasEmbeds = [regla1, regla2, regla3, regla4, regla5];

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(reglas.attachment)
                        .defColor(Colores.verdejeffrey),
                    ...reglasEmbeds,
                    new Embed()
                        .defTitle(`Reportar usuarios`)
                        .defDesc(`**—** Si te parece que alguien hizo algo malo, puedes reportar usuarios usando los Tickets.`)
                        .defColor(Colores.verdeclaro),
                    new Embed()
                        .defFooter({ text: `Al hablar en el chat aseguras que has leído las reglas del servidor y que las cumplirás.`, icon: client.EmojisObject.Check.url })
                        .defColor(Colores.verdeclaro)
                ], files: [reglas.file]
            });
            break;

        case "auto roles":
            let autoroles = importImage("autoroles");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(autoroles.attachment)
                        .defColor(Colores.verde)
                ], files: [autoroles.file]
            });
            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defTitle("Roles de anuncios")
                        .defColor(Colores.verdeclaro)
                ]
            })

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defTitle("Roles de notificaciones")
                        .defColor(Colores.verdejeffrey)
                ]
            })

            break;

        case "vip roles":
            let viproles = importImage("rolesvip");
            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .setImage(viproles.attachment)
                        .defColor(Colores.verde),
                    new Embed()
                        .defDesc(`**—** ¡No puede ser! ¡Más roles exclusivos!

🌠 ➟ **¡Vídeos antes de tiempo!**
📸 ➟ **¡Sneak Peeks!**`)
                        .defColor(Colores.nocolor)
                ], files: [viproles.file]
            });

            break;

        case "staff manual":
            let hola = importImage("hola");
            let loNuevo = importImage("lonuevo");
            let loActualizado = importImage("loactualizado");
            let infracciones = importImage("infracciones");
            let req = importImage("req");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defColor(Colores.verdejeffrey)
                        .defImage(hola.attachment),
                    new Embed()
                        .defColor(Colores.nocolor)
                        .defDesc(`¡Hola de nuevo miembro del STAFF!

Hoy ${time()}, tenemos un nuevo/mejorado sistema de moderación gracias a Jeffrey Bot. Algunas cosas han cambiado y te lo explicaré ahora:`),
                    new Embed()
                        .defColor(Colores.verde)
                        .setImage(loNuevo.attachment),
                    new Embed()
                        .defColor(Colores.nocolor)
                        .defTitle("Hay algunos comandos nuevos:")
                        .defDesc(`\`/moduleban\` • Con el cual podremos limitar a un usuario en ciertos módulos dentro de Jeffrey Bot.

\`/sencuesta\` • Es un nuevo comando para hacer encuestas y publicarlas en el canal de anuncios configurado en la Dashboard.

\`/userinfo\` • Saber la información de un usuario, **aquí se verán los Warns & Softwarns** del usuario.

[ADMIN] \`/admin\` • Administración de secciones dentro del servidor: tiendas, vault, las nuevas llaves canjeables.

[ADMIN] \`/config\` • Configuración del bot: las reglas, el link a la Dashboard (donde se configura TODO el bot), cooldowns y modificadores.

[ADMIN] \`/lockdown\` • Bloquear el canal donde se ejecuta, evitando que los usuarios lo vean o puedan escribir.

[ADMIN] \`/temp\` • Agregar roles temporales a un usuario: ya sean boosts, simplemente role temporal.`),
                    new Embed()
                        .defColor(Colores.verde)
                        .defImage(loActualizado.attachment),

                    new Embed()
                        .defColor(Colores.nocolor)
                        .defTitle("Y otros que fueron actualizados:")
                        .defDesc(`\`/clear\` • Ahora se pueden eliminar más de 100 mensajes.

\`/mute\` • Ya no se mutea usando un role, sino el sistema de timeouts.

\`/unmute\` • Se desmutea quitando el timeout.

\`/warn\` y \`/softwarn\` • Ahora se necesita prueba fotográfica para darlos. El softwarn no será informado al usuario.

\`/pardon\` • Los warns y softwarns tendrán IDs separadas, hay que especificar el tipo de pardon que quieras hacer.

\`/autoroles\` • Se tiene que “configurar” los autoroles antes de poder crearlos (\`/autoroles config\`).`),
                    new Embed()
                        .defColor(Colores.verde)
                        .defImage(infracciones.attachment),
                    new Embed()
                        .defColor(Colores.nocolor)
                        .defDesc(`**—** Si un usuario incumple una regla, hay que usar el Softwarn primero que todo. **Siempre DEBERÍA ser usada**, estos sólo son una forma que tenemos para saber si un usuario ya fue “perdonado” por incumplir una regla, a la segunda se debe usar el Warn.

**—** Si se intenta usar el Warn antes que el Softwarn, Jeffrey Bot te lo hará saber. No siempre es bueno dejar pasar las cosas, te lo dejo a tu criterio.`),
                    new Embed()
                        .defColor(Colores.verde)
                        .setImage(req.attachment),
                    new Embed()
                        .defColor(Colores.nocolor)
                        .defAuthor({ text: "Requisitos para mantenerte como STAFF", title: true })
                        .defDesc(`__Primero que todo, recuerda que esto no es nada serio y no le debes nada a nadie__.

Ahora, creo que es bastante obvio que lo único que Jeffrey espera de ti es:

> • No abusar de tu poder.
> • Dar un poco de señales de vida.
> • Lo que te dije de primero, relájate un poco, todo esto es por diversión, ¿verdad?`)
                ], files: [hola.file, loNuevo.file, loActualizado.file, infracciones.file, req.file]
            });
            break;

        case "darkshop info":
            let darkshop = importImage("darkshop");
            let items = importImage("items");
            let inflacion = importImage("inflacion");
            let inversiones = importImage("inversiones");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defImage(darkshop.attachment)
                        .defColor(Colores.negro),
                    new Embed()
                        .defTitle(`¿Qué es la DarkShop?`)
                        .defDesc(`
**—** La DarkShop es otra tienda a parte de la normal \`/shop\`, donde podrás comprar items más atrevidos que pueden perjudicar a otros usuarios.\n
**—** Todos los comandos disponibles los puedes ver en la categoría de la DarkShop con \`/ayuda\`, cuando seas nivel 5.`)
                        .defColor(Colores.nocolor),
                    new Embed()
                        .defImage(items.attachment)
                        .defColor(Colores.negro),
                    new Embed()
                        .defTitle(`Protección contra items`)
                        .defDesc(`**—** Para protegerte de los items, puedes comprar el item **Firewall**. Al activarlo, tendrás protección sobre cualquier item que te afecte.\n
**—** Para saltar la **Firewall**, se necesita de otro item: __**Bypasser**__, con solo tenerlo en el inventario lo podrás usar: cuando uses un item contra otro usuario, habrá una probabilidad de saltar su **Firewall**.`)
                        .defColor(Colores.nocolor),
                    new Embed()
                        .defImage(inflacion.attachment)
                        .defColor(Colores.negro),
                    new Embed()
                        .defTitle(`¿Cómo funciona la inflación?`)
                        .defDesc(`**— La inflación cambia __¡¡TODOS LOS DÍAS!!__**
**—** Los domingos será del **-5%** al **5%**.
**—** El resto de días puede oscilar del **-200%** al **200%**. La inflación cambiará **dos veces al día** entre semanas: usa \`/inflacion\` para saber cuando será el próximo cambio.
**—** Cuando la inflación está en su pico **${Emojis.DarkJeffros}1** = **${Emojis.Jeffros}600**, mientras que cuando toca fondo **${Emojis.DarkJeffros}1** = **${Emojis.Jeffros}66,67**.`)
                        .defFooter({ text: "Aunque hayan decimales, los cambios siempre se redondearán", icon: EmojisObject.Error.url })
                        .defColor(Colores.nocolor),
                    new Embed()
                        .defImage(inversiones.attachment)
                        .defColor(Colores.negro),
                    new Embed()
                        .defTitle(`¿Eso significa que...?`)
                        .defDesc(`
**—** Inversiones. Debido a la inflación, puedes llegar incluso a comprar **${Emojis.DarkJeffros}100** por **${Emojis.Jeffros}19.048** que esos mismos **${Emojis.DarkJeffros}100** cuesten **${Emojis.Jeffros}60.000**.\n
**—** Mientras más dinero tengas, muchas cosas se volverán más costosas, ten cuidado.`)
                        .defColor(Colores.nocolor),
                    new Embed()
                        .defTitle("Una última cosa...")
                        .defDesc(`**—** Sólo puedes cambiar **DarkJeffros** los **domingos**, y si pasa toda la semana y no los cambiaste, el próximo domingo **los perderás todos**.\n
**—** Puedes usar \`/predict\` para predecir una vez por semana si es buena idea revender tus **DarkJeffros** con la inflación de **ese momento**.\n
**—** Dicen que la inflación sigue un patrón, ¿será verdad...?`)
                        .defColor(Colores.rojo),
                    new Embed()
                        .defTitle(`Ya estás list@, ve por todas. Vuélvete el próximo TOP 1.`)
                        .defColor(Colores.verdejeffrey)
                ], files: [darkshop.file, items.file, inflacion.file, inversiones.file]
            })
            break;

        case "vip info":
            let info = importImage("informacion");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defImage(info.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .defTitle("Bienvenid@ a los VIPs")
                        .defDesc(`**—** Ahora que eres **VIP**, tienes algunos beneficios **sobre los demás usuarios**:\n
<#552580632266407957> • **Colores especiales, colores extras** con los que puedes colorear tu nombre.\n
☄️ • **Roles exclusivos de VIPs** arriba del todo, en <id:customize>.\n
🚀 • Obtienes **100% más** de lo que obtendrías normalmente hablando en los canales.\n
https://discord.gg/${process.env.SUPPORT_INVITE} • Servidor **exclusivo** de pruebas de Jeffrey Bot.`)
                        .defColor(Colores.nocolor)
                ], files: [info.file]
            })
            break;

        case "ticket info":
            let tickets = importImage("tickets");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defImage(tickets.attachment)
                        .defColor(Colores.verdejeffrey),
                    new Embed()
                        .defColor(Colores.cake)
                        .defDesc(`**—** Los Tickets son la forma que tienes de comunicarte de forma privada con el STAFF.`),
                    new Embed()
                        .defTitle("Tipos de Tickets")
                        .defDesc(`**• Dudas / Problemas**: Si necesitas ayuda con algo del servidor y requieres de ayuda directa del STAFF usa este ticket.\n
**• Reportes**: Si tienes algún problema con alguien, crees que es un peligro para el servidor, usa este ticket.\n
**• Warn injusto**: Si crees que el warn que te dieron fue injustificado, usa este ticket.\n
**• Jeffrey Bot**: Reportar bugs, problemas con Jeffrey Bot, etc. Usa este ticket.`)
                        .defColor(Colores.nocolor)
                ], files: [tickets.file]
            })

            break;

        case "ticket":
            let ticketRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("createTicket")
                        .setLabel("CREAR TICKET")
                        .setStyle(ButtonStyle.Success)
                        .setEmoji("🎫")
                );
            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defAuthor({ text: "NUEVO TICKET", title: true })
                        .defDesc(`**—** ¿Necesitas ayuda? ¿Alguna duda? ¿Warn injusto?\n
**•** Pulsa el botón de aquí abajo para crear un ticket para **hablar directamente con el STAFF**.`)
                        .defColor(Colores.verdeclaro)
                ], components: [ticketRow]
            });
            break;

        case "cumple info":
            let cumple = importImage("cumple");

            await interaction.channel.send({
                embeds: [
                    new Embed()
                        .defColor(Colores.verde)
                        .defImage(cumple.attachment),
                    new Embed()
                        .defColor(Colores.nocolor)
                        .defTitle("¿Cuándo es tu cumpleaños?")
                        .defDesc(`**—** Puedes definir tu cumpleaños si gustas, se te dará un role el día de tu cumpleaños.
**—** ¡Este role te dará casi todos los beneficios de tener VIP!
> • 100% más recompensas de lo que obtendrías hablando normalmente en los canales.
> • Cooldown de \`/coins\` reducido a la cuarta parte (\`2.5 min\`).
> • Canal de colores especiales desbloqueados temporalmente (<#552580632266407957>).`),
                    new Embed()
                        .defColor(Colores.verdejeffrey)
                        .defTitle("¿Te interesa?")
                        .defDesc(`**—** Puedes cambiar tu cumpleaños usando el comando \`/cumple edit\`.
**—** Cuando todo esté listo, usa \`/cumple lock\`, no podrás cambiar tu cumpleaños hasta un año después.
**—** Tu cumpleaños aparecerá en tu perfil cuando usen \`/stats\`, y podrá ser recordado por otros usuarios.`)
                ], files: [cumple.file]
            });
            break;
    }

    return await interaction.editReply({
        content: null, embeds: [
            new Embed({
                type: "success"
            })
        ]
    });
}

module.exports = command;