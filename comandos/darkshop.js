const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
var Chance = require("chance");
var chance = new Chance();
const ms = require("ms");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");

const Stats = require("../modelos/darkstats.js");
const Items = require("../modelos/darkitems.js");
const DarkUse = require("../modelos/darkUse.js");
const GlobalData = require("../modelos/globalData.js");
const darkstats = require("../modelos/darkstats.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let dsChannel = guild.channels.cache.find(x => x.id === Config.dsChannel);
  let dsRole = guild.channels.cache.find(x => x.id === Config.dsRole);

  if(bot.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    dsRole = guild.roles.cache.find(x => x.id === "791006500973576262");
    dsChannel = guild.channels.cache.find(x => x.id === "790431676970041356");
  }

  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return console.log("Un usuario ha intentado usar /darkshop: "+ author.tag);

  const itemPerPage = 3;

  // ¿es nivel 5?
  Jeffros.findOne({
      serverID: guild.id,
      userID: author.id
  }, (err, jeffros) => {

    GlobalData.findOne({
        "info.type": "dsInflation"
    }, (err, dark) => {
            if (err) throw err;
        
            Exp.findOne({
                serverID: guild.id,
                userID: author.id
            }, (err, exp) => {
                if(err) throw err;

                if(exp.level >= 5){ // si cumple los requisitos

                    // si no hay args, muestra la página principal
                    if(!args[0]){
                        let tienda = new Discord.MessageEmbed()
                        .setAuthor(`| DarkShop`, Config.darkLogoPng)
                        .setColor(Colores.negro)
                        .setDescription(`**—** Bienvenido a la DarkShop. \`${prefix}darkshop help\` para ver todos los comandos disponibles.
            **—** Para comprar items usa \`${prefix}darkshop <ID del item>\`.
            **—** Para tener más información del item usa \`${prefix}darkshop info <id>\`.
            **—** Esta tienda __**NO**__ usa los Jeffros convencionales, usa \`${prefix}darkshop bal\` para saber tu saldo.`);
                        

                        // BUSCAR DARKITEMS

                        Items.find({

                        }, (err, items) => {
                            if (err) throw err;

                            // caso 1: no hay darkitems
                            if (!items || items.length === 0){
                                tienda.addField(
                                    `— No hay nada`,
                                    `Sal antes de que alguien te vea...`
                                );

                                return message.channel.send(tienda);
                            } else {
                                // hay menos de itemPerPage

                                if(items.length <= itemPerPage){
                                    tienda.setFooter(`| DarkShop - Página 1 de 1 | Alias: ${prefix}ds`, guild.iconURL());
                                
                                    for(let i = 0; i < items.length; i++){
                                        let precio = items[i].itemPrice;
                                        tienda.addField(
                                            `— { ${items[i].id} } ${items[i].itemName}`,
                                            `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Dark}${precio}`
                                        );

                                        if (i + 1 === items.length){
                                            return message.channel.send(tienda);
                                        }
                                    }
                                } else { // hay más de itemPerPage
                                    let pagn = 1;
                                    let totalpags;

                                    Items.countDocuments({}, (err, c) => {
                                        if (err) throw err;

                                        totalpags = Math.floor(c / itemPerPage);

                                        if(!Number.isInteger(c / itemPerPage)) totalpags++;

                                        let inicio = itemPerPage * pagn - itemPerPage + 1;
                                        let fin = itemPerPage * pagn;

                                        inicio = inicio - 1;

                                        if(items.length < fin - 1){
                                            fin = items.length;
                                        } else if(items.length === fin - 1){
                                            fin = items.length - 1;
                                        } else {
                                            fin = fin - 1;
                                        }

                                        tienda.setFooter(`| DarkShop - Página 1 de ${totalpags} | Alias: ${prefix}ds`, guild.iconURL());

                                        // hacer primera página
                                        for(let i = 0; i < itemPerPage; i++){
                                            let precio = items[i].itemPrice;
                                            tienda.addField(
                                                `— { ${items[i].id} } ${items[i].itemName}`,
                                                `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Dark}${precio}`
                                            );

                                            if (i + 1 === itemPerPage){
                                                message.channel.send(tienda).then(msg => {
                                                    msg.react("⏪").then(r => {
                                                        msg.react("⏩");

                                                        // filtros
                                                        const backwardsFilter = (reaction, user) => reaction.emoji.name === "⏪" && user.id === message.author.id;
                                                        const forwardsFilter = (reaction, user) => reaction.emoji.name === "⏩" && user.id === message.author.id;
                                
                                                        // collectors
                                                        const backwards = msg.createReactionCollector(backwardsFilter, {time: 60000});
                                                        const forwards = msg.createReactionCollector(forwardsFilter,{time: 60000});

                                                        // si se reacciona atrás
                                                        backwards.on("collect", r => {
                                                            if(pagn === 1) return;

                                                            pagn--;

                                                            let embed = new Discord.MessageEmbed()
                                                            .setAuthor(`| DarkShop`, Config.darkLogoPng)
                                                            .setColor(Colores.negro)
                                                            .setDescription(`**—** Bienvenido a la DarkShop. \`${prefix}darkshop <ID del item>\`.
            **—** Para tener más información del item usa \`${prefix}darkshop info <id>\`.
            **—** Esta tienda __**NO**__ usa los Jeffros convencionales, usa \`${prefix}darkshop bal\` para saber tu saldo.`);

                                                            Items.countDocuments({}, (err, c) => {
                                                                if (err) throw err;

                                                                totalpags = Math.floor(c / itemPerPage);

                                                                if (!Number.isInteger(c / itemPerPage))
                                                                totalpags++;

                                                                let inicio = itemPerPage * pagn - itemPerPage + 1;
                                                                let fin = itemPerPage * pagn;

                                                                inicio = inicio - 1; // 0

                                                                if (items.length < fin - 1) {
                                                                fin = items.length;
                                                                } else if (items.length === fin - 1) {
                                                                fin = items.length - 1;
                                                                } else {
                                                                fin = fin - 1;
                                                                }

                                                                embed.setFooter(
                                                                `| DarkShop - Página ${pagn} de ${totalpags} | Alias: ${prefix}ds`,
                                                                guild.iconURL()
                                                                );

                                                                for (let i = inicio; i < fin + 1; i++) {
                                                                    let precio = items[i].itemPrice;
                                                                    embed.addField(
                                                                        `— { ${items[i].id} } ${items[i].itemName}`,
                                                                        `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Dark}${precio}`
                                                                    );

                                                                    if (i + 1 === fin + 1) {
                                                                        return msg.edit(embed);
                                                                    }
                                                                }
                                                            });
                                                        });

                                                        // si se reacciona adelante
                                                        forwards.on("collect", r => {
                                                            if(pagn === totalpags) return;;
                                                            pagn++;

                                                            let embed = new Discord.MessageEmbed()
                                                            .setAuthor(`| DarkShop`, Config.darkLogoPng)
                                                            .setColor(Colores.negro)
                                                            .setDescription(`**—** Bienvenido a la DarkShop. \`${prefix}darkshop <ID del item>\`.
            **—** Para tener más información del item usa \`${prefix}darkshop info <id>\`.
            **—** Esta tienda __**NO**__ usa los Jeffros convencionales, usa \`${prefix}darkshop bal\` para saber tu saldo.`);

                                                            Items.countDocuments({}, (err, c) => {
                                                                if (err) throw err;

                                                                totalpags = Math.floor(c / itemPerPage);

                                                                if (!Number.isInteger(c / itemPerPage))
                                                                totalpags++;

                                                                let inicio = itemPerPage * pagn - itemPerPage + 1;
                                                                let fin = itemPerPage * pagn;

                                                                inicio = inicio - 1;

                                                                if (items.length <= fin - 1) {
                                                                fin = items.length;
                                                                }

                                                                embed.setFooter(
                                                                `| DarkShop - Página ${pagn} de ${totalpags} | Alias: ${prefix}ds`,
                                                                guild.iconURL()
                                                                );

                                                                for (let i = inicio; i < fin + 1; i++) {
                                                                    let precio = items[i].itemPrice;
                                                                    embed.addField(
                                                                        `— { ${items[i].id} } ${items[i].itemName}`,
                                                                        `\`▸\` ${items[i].itemDescription}\n▸ ${Emojis.Dark}${precio}`
                                                                    );
                                                                    if (i + 1 === fin) {
                                                                        return msg.edit(embed);
                                                                    }
                                                                }
                                                            });
                                                        });


                                                    })
                                                })
                                            }
                                        }
                                    })
                                }
                            }
                        })
                    } else {

                    switch(args[0]){
                        case "help":
                        case "ayuda":
                            let embedAyuda = new Discord.MessageEmbed()
                            .setAuthor(`| Comandos`, Config.darkLogoPng)
                            .setDescription(`**—** \`${prefix}ds bal\`: Mira tus estadísticas.
            **—** \`${prefix}ds status\`: Mira el estado de la moneda.
            **—** \`${prefix}ds duration\`: Miras la fecha/duración que tienen tus DarkJeffros actuales.
            **—** \`${prefix}ds change\`: Cambia tus Jeffros por DarkJeffros.
            **—** \`${prefix}ds withdraw\`: Cambia tus DarkJeffros por Jeffros.
            **—** \`${prefix}ds calc\`: Determina automáticamente cuantos Jeffros tienes actualmente.
            **—** \`${prefix}ds info\`: Mira la información de un item.
            **—** \`${prefix}ds <id>\`: Compra uno de los items.`)
                            .setColor(Colores.negro);

                            message.channel.send(embedAyuda);
                            break;

                        case "status":
                        case "estado":
                            let stonks
                            if(dark.info.oldinflation <= dark.info.inflation){
                                stonks = "📈";
                            } else {
                                stonks = "📉";
                            }

                            let stonksEmbed = new Discord.MessageEmbed()
                            .setAuthor(`| Estado`, Config.darkLogoPng)
                            .setDescription(`${stonks} **—** La inflación actual de los DarkJeffros es de un **${dark.info.inflation}%**.
    **— ${Emojis.Dark}1 = ${Emojis.Jeffros}${Math.floor(200*dark.info.inflation)}**.
    **—** Antes era de un \`${dark.info.oldinflation}%\`.`)
                            .setColor(Colores.negro);

                            message.channel.send(stonksEmbed);
                            break;
                        
                        case "duration":
                        case "dur":
                        case "d":

                            let error1 = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.darkLogoPng)
                            .setColor(Colores.negro)
                            .setDescription(`**—** Parece que no se ha generado ninguna fecha de expiración... intenta cambiando algunos Jeffros por DarkJeffros...`)
                            .setFooter("▸ Si crees que se trata de un error, contacta al Staff.");

                            GlobalData.findOne({
                                "info.type": "dsDJDuration",
                                "info.userID": author.id
                            }, (err, authorData) => {
                                if(err) throw err;

                                if(!authorData){
                                    return message.channel.send(error1);
                                } else {
                                    // leer y cambiar si es necesario

                                    let oldDate = new Date(authorData.info.since); // fecha del dia inicial
                                    let newDate = new Date(); // hoy

                                    let diference1 = newDate.getTime() - oldDate.getTime();
                                    let pastDays = Math.floor(diference1 / (1000 * 3600 * 24)); // dias transcurridos

                                    let embed = new Discord.MessageEmbed()
                                    .setAuthor(`| Información del usuario N°${author.id}`, author.displayAvatarURL())
                                    .setDescription(`**— Duración total**: \`${authorData.info.duration}\` días.
                                    **— Desde la fecha**: \`${authorData.info.since}\`.
                                    **— Han transcurrido**: \`${pastDays}\` días.
                                    
                                    ***— No te dejes tomar tanto tiempo, consejo de profesional. La zona horaria en la Dark Shop es probable, sea diferente a la tuya. Recuerda: A penas pasen los días estipulados, todos los DarkJeffros que no hayas cambiado por Jeffros serán ELIMINADOS.***`)
                                    .setThumbnail(Config.darkLogoPng)
                                    .setColor(Colores.negro);
                                    
                                    message.channel.send(embed)
                                }
                            })
                            break;

                        case "dep":
                        case "deposit":
                        case "depositar":
                        case "cambio":
                        case "change":
                            let instructions = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.darkLogoPng)
                            .setColor(Colores.negro)
                            .setDescription(`▸ El uso correcto es: /darkshop change <DarkJeffros>
                            **—** Se calculará cuantos Jeffros necesitas para tener esa cantidad de DarkJeffros y se añadirán a tu cuenta de la DarkShop.`)

                            if(!args[1]) return message.channel.send(instructions);

                            let wanted = Math.floor(args[1]);

                            // analizando inflación ¿a cuanto equivale un darkjeffro?
                            inflation = dark.info.inflation
                            darkjeffro = 200*inflation

                            totalJeffros = Math.floor(darkjeffro * wanted);

                            let embed = new Discord.MessageEmbed()
                            .setAuthor(`| Éxito`, Config.darkLogoPng)
                            .setDescription(`**—** Se han restado **${Emojis.Jeffros}${totalJeffros}**.
                            **—** Se añadieron **${Emojis.Dark}${wanted}** a tu cuenta.`)
                            .setFooter(`Por favor, usa '${prefix}ds duration' para saber el tiempo que tienes para poder vender cambiar tus DarkJeffros.`)
                            .setColor(Colores.negro);

                            let nope = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.darkLogoPng)
                            .setDescription(`**—** No tienes suficientes Jeffros para cambiar.
                            **—** Inflación: **${Emojis.Dark}1** = **${Emojis.Jeffros}${darkjeffro}**
                            **—** Necesitas **${Emojis.Jeffros}${totalJeffros}** para cambiar a **${Emojis.Dark}${wanted}**.`)
                            .setColor(Colores.negro);

                            // verificar si tiene o no jeffros suficientes.
                            if(totalJeffros > jeffros.jeffros) return message.channel.send(nope);

                            Stats.findOne({
                                userID: author.id
                            }, (err, stats) => {
                                if(err) throw err;

                                // agregar una nueva data global: "duracion de darkjeffros"
                                GlobalData.findOne({
                                    "info.type": "dsDJDuration",
                                    "info.userID": author.id
                                }, (err, djDuration) => {
                                    if(err) throw err;

                                    date = new Date() // hoy
                                    duration = Number(dark.info.duration) + Math.floor(Math.random() * 60); // duración máxima 60 días & minima de la duracion de la inflacion actual.

                                    if(!djDuration){ // si no existe ninguna data global de tipo dsDJDuration, simplemente crear una nueva para este usuario
                                        const newData = new GlobalData({
                                            info: {
                                                type: "dsDJDuration", // duracion de darkjeffros en la ds
                                                userID: author.id,
                                                since: date,
                                                duration: duration
                                            }
                                        })

                                        newData.save();
                                    } else {
                                        console.log("Ya tiene una duracion de DJ de " + djDuration.info.duration)

                                        // ya pasó el tiempo?

                                        let oldDate = new Date(djDuration.info.since);
                                        let newDate = new Date()

                                        let diference1 = newDate.getTime() - oldDate.getTime();
                                        let pastDays = Math.floor(diference1 / (1000 * 3600 * 24));

                                        if(pastDays >= djDuration.info.duration){
                                            djDuration.info.since = date;
                                            djDuration.info.duration = duration;
    
                                            djDuration.markModified("info");
                                            djDuration.save();
                                        } else {
                                            return console.log("aun no ha pasado el tiempo");
                                        }
                                    }
                                })

                                if(!stats){
                                    const newStats = new Stats({
                                        userID: author.id,
                                        djeffros: wanted,
                                        accuracy: Number(Number(Math.random() * 15).toFixed(1)),
                                        items: []
                                    });

                                    jeffros.jeffros -= totalJeffros;

                                    jeffros.save();
                                    newStats.save();

                                    message.channel.send(embed)
                                } else {
                                    jeffros.jeffros -= totalJeffros;
                                    stats.djeffros += wanted;

                                    jeffros.save();
                                    stats.save();

                                    message.channel.send(embed);
                                }
                            })
                            
                            break;

                        case "with":
                        case "withdraw":
                        case "retirar":
                            let instructions2 = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.darkLogoPng)
                            .setColor(Colores.negro)
                            .setDescription(`▸ El uso correcto es: /darkshop withdraw <DarkJeffros>
                            **—** Se cambiarán los DarkJeffros especificados, por Jeffros.`)

                            if(!args[1]) return message.channel.send(instructions2);

                            let changing = Math.floor(args[1]);

                            // analizando inflación ¿a cuanto equivale un darkjeffro?
                            inflation = dark.info.inflation
                            darkjeffro = 200*inflation

                            totalJeffros = Math.floor(darkjeffro * changing);

                            Stats.findOne({
                                userID: author.id
                            }, (err, stats) => {
                                if(err) throw err;
                                    
                                let have = stats.djeffros || 0;
                                let embed = new Discord.MessageEmbed()
                                .setAuthor(`| Éxito`, Config.darkLogoPng)
                                .setDescription(`**—** Se han restado **${Emojis.Dark}${changing}** de tu cuenta.
                                **—** Se añadieron **${Emojis.Jeffros}${totalJeffros}**.`)
                                .setColor(Colores.negro);

                                let nope = new Discord.MessageEmbed()
                                .setAuthor(`| Error`, Config.darkLogoPng)
                                .setDescription(`**—** No tienes tantos DarkJeffros para cambiar.
                                **—** Quieres cambiar: **${Emojis.Dark}${changing}**.
                                **—** Tienes: **${Emojis.Dark}${have}**.`)
                                .setColor(Colores.negro);
                                
                                if(!stats){
                                    message.channel.send(nope)
                                } else {
                                    
                                    // verificar si tiene o no jeffros suficientes.
                                    if(changing > stats.djeffros) return message.channel.send(nope);

                                    jeffros.jeffros += totalJeffros;
                                    stats.djeffros -= changing;

                                    jeffros.save();
                                    stats.save();

                                    message.channel.send(embed);
                                }
                            })
                            
                            break;
        
                        case "calc":
                        case "calculator":
                            Stats.findOne({
                                userID: author.id
                            }, (err, stats) => {
                                if (err) throw err;
                                let stonks;
                                
                                if(dark.info.oldinflation <= dark.info.inflation){
                                    stonks = "📈";
                                } else {
                                    stonks = "📉";
                                }

                                if(!args[1]){
                                    if(!stats){
                                        let stonksEmbed = new Discord.MessageEmbed()
                                        .setAuthor(`| Cálculo`, Config.darkLogoPng)
                                        .setDescription(`${stonks} **— ${dark.info.inflation}%**.
        **— ${Emojis.Dark}? = ${Emojis.Jeffros}?**.`)
                                        .setColor(Colores.negro);

                                        return message.channel.send(stonksEmbed);
                                    } else {

                                        let stonksEmbed = new Discord.MessageEmbed()
                                        .setAuthor(`| Cálculo`, Config.darkLogoPng)
                                        .setDescription(`${stonks} **— ${dark.info.inflation}%**.
        **— ${Emojis.Dark}${stats.djeffros} = ${Emojis.Jeffros}${Math.floor(stats.djeffros*200*dark.info.inflation)}**.`)
                                        .setColor(Colores.negro);

                                        message.channel.send(stonksEmbed);
                                    }
                                } else if(!isNaN(args[1])){
                                    let stonksEmbed = new Discord.MessageEmbed()
                                        .setAuthor(`| Cálculo`, Config.darkLogoPng)
                                        .setDescription(`${stonks} **— ${dark.info.inflation}%**.
        **— ${Emojis.Dark}${args[1]} = ${Emojis.Jeffros}${Math.floor(args[1]*200*dark.info.inflation)}**.`)
                                        .setColor(Colores.negro);

                                        message.channel.send(stonksEmbed);
                                } else {
                                    let stonksEmbed = new Discord.MessageEmbed()
                                    .setAuthor(`| Cálculo`, Config.darkLogoPng)
                                    .setDescription(`${stonks} **— ${dark.info.inflation}%**.
    **— ${Emojis.Dark}${stats.djeffros} = ${Emojis.Jeffros}${Math.floor(stats.djeffros*200*dark.info.inflation)}**.`)
                                    .setColor(Colores.negro);

                                    message.channel.send(stonksEmbed);
                                }
                            })

                            break;
                        
                        case "stats":
                        case "stat":
                        case "me":
                        case "yo":
                        case "bal":
                            // buscar el saldo del usuario
                            Stats.findOne({
                                userID: author.id
                            }, (err, stats) => {
                                if(err) throw err;

                                if(!stats){
                                    let error = new Discord.MessageEmbed()
                                    .setAuthor(`| Error`, Config.darkLogoPng)
                                    .setDescription(`**— DarkJeffros**: ?
            **— Precisión**: ?
            **— Items**: ?`)
                                    .setThumbnail(Config.darkLogoPng)
                                    .setColor(Colores.negro);

                                    message.channel.send(error)
                                } else {
                                    let statsEmbed = new Discord.MessageEmbed()
                                    .setAuthor(`| Estadísiticas del usuario N°${author.id}`, author.displayAvatarURL())
                                    .setDescription(`**— DarkJeffros**: ${Emojis.Dark}${stats.djeffros}.
            **— Precisión**: ${stats.accuracy}%
            **— Items**: Usa \`${prefix}d̶̪͍̏̉̉͒a̸̺͖͓͉̯̝̔̒͛̏͝r̴͖̗͉̬̼̊̇͝ͅk̸̢͕̠͊̄̀̊̐͜s̵̲̅͑̓h̴̢̰̻̜͙́o̶̱͒́̾p̷̮̞͍̲͐̏̉̊͋̂ ̷̹̃̑̇͘̚í̷̯t̶̮̙̙͙͎͉̑̈̌̀̈e̴̛̜̱͛̌m̴̙͕͇̻̹̭͑̌s̵̡̧̻̯̐̈́͌̆̆͝\``)
                                    .setThumbnail(Config.darkLogoPng)
                                    .setColor(Colores.negro);
                                    
                                    message.channel.send(statsEmbed)

                                }
                            })
                            break;

                        case "add":
                            // añadir un darkitem
                            if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

                            let plus = 1;
                            Items.countDocuments({}, (err, c) => {
                                Items.findOne(
                                {
                                    id: c + plus
                                },
                                (err, found) => {
                                    if (err) throw err;

                                    if (!found) {
                                    } else {
                                    while (c + plus === found.id) {
                                        c += plus + 1;
                                        console.log("equal id");
                                    }
                                    }

                                    // /shop add nombre precio
                                    // /shop  0    1      2

                                    let errorEmbed = new Discord.MessageEmbed()
                                    .setAuthor(`| Error`, Config.errorPng)
                                    .setDescription(
                                        `▸ El uso correcto es: /darkshop add <nombre> <precio>
            **—** Para los roles, si no se necesita, rellenar con "\`na\`".`
                                    )
                                    .setColor(Colores.nocolor);

                                    if (!args[1]) return message.channel.send(errorEmbed);
                                    if (!args[2]) return message.channel.send(errorEmbed);

                                    let nameItem = args[1];
                                    let priceItem = args[2];

                                    let lastID = c + plus;

                                    const newItem = new Items({
                                    itemName: nameItem,
                                    itemPrice: priceItem,
                                    itemDescription: "na",
                                    replyMessage: "¡Item usado con éxito!",
                                    id: lastID
                                    });

                                    newItem.save();
                                    let goodEmbed = new Discord.MessageEmbed()
                                    .setAuthor(`| Listo`, Config.bienPng)
                                    .setDescription(`**—** Para personalizar la información del item usa \`${prefix}darkshop edit <id> <nombre, precio, etc...> <nuevo>\`.

            **—** Nombre: \`${nameItem}\`.
            **—** Precio: ${Emojis.Dark}${priceItem}.
            **—** Descripción: \`na\`.
            **—** Mensaje después de comprar: \`¡Item usado con éxito!\`.
            **—** ID: \`${lastID}\`.`
                                    )
                                    .setColor(Colores.verde);
                                    return message.channel.send(goodEmbed);
                                
                                });
                            });

                            break;

                        case "remove":
                            // eliminar un darkitem
                            if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
                            // /shop remove id
                            // /shop    0    1

                            let errorEmbed = new Discord.MessageEmbed()
                                .setAuthor(`| Error`, Config.errorPng)
                                .setDescription(`▸ El uso correcto es: /darkshop remove <id del item>`)
                                .setColor(Colores.nocolor);

                            if (!args[1]) return message.channel.send(errorEmbed);

                            Items.findOneAndDelete(
                                {
                                id: args[1]
                                },
                                (err, data) => {
                                if (err) throw err;

                                if (!data) {
                                    return message.reply(`no he encontrado ese item con ese id.`);
                                } else {
                                    return message.reply(`se ha eliminado!`);
                                }
                                }
                            );
                            break;

                        case "info":
                            let errorEmbed2 = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.errorPng)
                            .setDescription(`▸ El uso correcto es: ${prefix}darkshop info <id del item>`);

                            if (!args[1]) return message.channel.send(errorEmbed2);

                            Items.findOne(
                                {
                                id: args[1]
                                },
                                (err, data) => {
                                    if (err) throw err;

                                    if (!data) {
                                        return message.reply(`no he encontrado ese item, revisa la id.`);
                                    } else {
                                        let reqrole = guild.roles.cache.find(
                                        x => x.id === data.roleRequired
                                        );

                                        if (!reqrole) {
                                        reqrole = "Ninguno";
                                        }

                                        let embed = new Discord.MessageEmbed()
                                        .setAuthor(`| Item ${data.id}`, Config.darkLogoPng)
                                        .setDescription(`**—** Si quieres cambiar algo usa el comando \`${prefix}shop edit <id> <nombre, precio, etc> <nuevo>\`.

            **—** Nombre: \`${data.itemName}\`.
            **—** Precio: ${Emojis.Dark}${data.itemPrice}.
            **—** Descripción: \`${data.itemDescription}\`.
            **—** Mensaje respuesta (lo que se envía después de comprar): \`${data.replyMessage}\`.
            **—** ID: \`${data.id}\`.`
                                        )
                                        .setColor(Colores.negro);

                                        return message.channel.send(embed);
                                    }
                                });
                                break;

                        case "edit":
                            // editar un darkitem
                            if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
                            let errorEmbed3 = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.errorPng)
                            .setDescription(
                                `▸ El uso correcto es: ${prefix}darkshop edit <id> <nombre, precio, etc> <nuevo>`
                            );
                    
                            if (!args[1]) return message.channel.send(errorEmbed3);
                            if (!args[2]) return message.channel.send(errorEmbed3);
                            if (!args[3]) return message.channel.send(errorEmbed3);
                    
                            let idItem = args[1];
                            let toEdit = args[2].toLowerCase();
                            let newData;
                    
                            Items.findOne(
                            {
                                id: idItem
                            },
                            (err, data) => {
                                if (err) throw err;
                    
                                if (!data) {
                                return message.reply(`no he encontrado este item.`);
                                } else {
                                let embed = new Discord.MessageEmbed()
                                    .setAuthor(`| Listo`, Config.bienPng)
                                    .setColor(Colores.verde);
                    
                                switch (toEdit) {
                                    case "name":
                                    case "nombre":
                                    newData = args
                                        .join(" ")
                                        .slice(args[0].length + args[1].length + args[2].length + 3);
                                    data.itemName = newData;
                                    embed.setDescription(
                                        `**—** Nombre: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                                    );
                                    break;
                    
                                    case "price":
                                    case "precio":
                                    case "jeffros":
                                    newData = args[3];
                                    data.itemPrice = newData;
                                    embed.setDescription(
                                        `**—** Precio: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                                    );
                                    break;
                    
                                    case "description":
                                    case "descripcion":
                                    case "desc":
                                    newData = args
                                        .join(" ")
                                        .slice(args[0].length + args[1].length + args[2].length + 3);
                                    data.itemDescription = newData;
                                    embed.setDescription(
                                        `**—** Descripción: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                                    );
                                    break;
                    
                                    case "reply":
                                    case "respuesta":
                                    case "resp":
                                    newData = args
                                        .join(" ")
                                        .slice(args[0].length + args[1].length + args[2].length + 3);
                                    data.replyMessage = newData;
                                    embed.setDescription(
                                        `**—** Mensaje respuesta: \`${newData}\`.\n**—** ID: \`${data.id}\`.`
                                    );
                                    break;
                    
                                    default:
                                    return message.reply(
                                        `\`${toEdit}\` no es una forma válida de editar los items.`
                                    );
                                }
                    
                                data.save();
                                return message.channel.send(embed);
                                }
                            });

                            break;

                        case "adduse":
                            if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
                        
                            let useEmbedError = new Discord.MessageEmbed()
                            .setDescription(`▸ El uso correcto es: ${prefix}darkshop adduse \`itemID\` \`add || remove\` \`jeffros | warns | role\`

                            **— Jeffros —**
                            ${prefix}darkshop adduse \`itemID\` \`add || remove\` \`jeffros\` \`# Jeffros\` \`positive | negative\`
                            **— Warns —**
                            ${prefix}darkshop adduse \`itemID\` \`add || remove\` \`warns\` \`# Warns\` \`positive | negative\`
                            **— Role —**
                            ${prefix}darkshop adduse \`itemID\` \`add || remove\` \`role\` \`roleID\` \`duración\` \`positive | negative\``)
                            .setColor(Colores.negro);


                            if (!args[1]){
                            useEmbedError.setAuthor(`| Error: itemID`, Config.errorPng);
                            return message.channel.send(useEmbedError)
                            }
                            if (!args[2]){
                                useEmbedError.setAuthor(`| Error: add / remove`, Config.errorPng);
                                return message.channel.send(useEmbedError)
                            }
                            if (!args[3]) {
                            useEmbedError.setAuthor(`| Error: j / w / r`, Config.errorPng);
                            return message.channel.send(useEmbedError)
                            }
                            
                            let accion = args[2].toLowerCase();
                            let cosa = args[3].toLowerCase();
                            let cosaID = "na";
                            let duracion = "na";
                            let cantidad = 0;
                            let efecto = "na";

                            // SI ES UN ROLE
                            if (args[3].toLowerCase() === "role" && !args[4]) {
                            useEmbedError.setAuthor(`| Error: roleID`, Config.errorPng);
                            return message.channel.send(useEmbedError)
                            } else if (args[3].toLowerCase() === "role") {
                            cosaID = args[4];
                            }

                            if(args[3].toLowerCase() === "role" && !args[5]){
                            useEmbedError.setAuthor(`| Error: duración`, Config.errorPng);
                            return message.channel.send(useEmbedError)
                            } else if (args[3].toLowerCase() === "role"){
                                duracion = Number(ms(args[5].toLowerCase()));
                            }
                            
                            if(args[3].toLowerCase() === "role" && !args[6]){
                                useEmbedError.setAuthor(`| Error: negative / positive`, Config.errorPng);
                                return message.channel.send(useEmbedError)
                            } else if (args[3].toLowerCase() === "role"){
                                efecto = args[6].toLowerCase();
                            }

                            // SI SON WARNS

                            if (args[3].toLowerCase() === "warns" && !args[4] || args[3].toLowerCase() === "warns" && isNaN(args[4])){
                            useEmbedError.setAuthor(`| Error: # Warns`, Config.errorPng);
                            return message.channel.send(useEmbedError)
                            } else {
                                cantidad = Number(args[4]);
                            }

                            if (args[3].toLowerCase() === "warns" && !args[5]){
                            useEmbedError.setAuthor(`| Error: negative / positive`, Config.errorPng);
                            return message.channel.send(useEmbedError)
                            } else {
                                efecto = args[5].toLowerCase();
                            }

                            // SI SON JEFFROS
                            if (args[3].toLowerCase() === "jeffros" && !args[4] || args[3].toLowerCase() === "jeffros" && isNaN(args[4])){
                            useEmbedError.setAuthor(`| Error: # Jeffros`, Config.errorPng);
                            return message.channel.send(useEmbedError)
                            } else {
                                cantidad = Number(args[4]);
                            }

                            if (args[3].toLowerCase() === "jeffros" && !args[5]){
                            useEmbedError.setAuthor(`| Error: negative / positive`, Config.errorPng);
                            return message.channel.send(useEmbedError)
                            } else {
                                efecto = args[5].toLowerCase();
                            }

                            /*
                                action - "delete" para quitar X cosa || "add" para agregar X cosa
                                thing - "jeffros" || "warns" || "role" || "item"
                                thingID - id de "thing", id de role, por ejemplo
                                extra - puede ser por ejemplo; la duración del efecto
                            */
                
                            const newUse = new DarkUse({
                            itemID: args[1],
                            info: {
                                action: accion,
                                thing: cosa,
                                thingID: cosaID,
                                extra: {
                                    duration: duracion,
                                    quantity: cantidad,
                                    effect: efecto
                                }
                            }
                            });
                
                            newUse.save().catch(e => console.log(e));
                            return message.react("✅");
                                
                        case "deluse":
                            if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
                            break;

                        case "items":
                            // embeds
                            let noItems = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.darkLogoPng)
                            .setDescription(
                            `**—** No encontré ningún item asociado a esta cuenta...`
                            )
                            .setColor(Colores.negro);

                            let noItem = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.darkLogoPng)
                            .setDescription(
                            `**—** No encontré ese item en esta cuenta...`
                            )
                            .setColor(Colores.negro);

                            let noStats = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.darkLogoPng)
                            .setDescription(
                            `**—** No he podido encontrar una cuenta con tu ID. Intenta cambiando unos cuántos Jeffros por DarkJeffros.`
                            )
                            .setColor(Colores.negro);

                            DarkUse.find({

                            }, (err, uses) => {
                                if(err) throw err;

                                if(!uses){
                                    return message.channel.send(`[01] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas ver tus items... :)`);
                                } else {
                                    Stats.findOne({
                                        userID: author.id
                                    }, (err, stats) => {
                                        if(err) throw err;

                                        if(!stats){
                                            return message.channel.send(noStats)
                                        } else { // tiene cuenta
                                            if(stats.items.length === 0) return message.channel.send(noItems);

                                            if(!args[1]){
                                                let itemsEmbed = new Discord.MessageEmbed()
                                                .setAuthor(`| Items del usuario N°${author.id}`, author.displayAvatarURL())
                                                .setThumbnail(Config.darkLogoPng)
                                                .setFooter(`${prefix}ds items {ID} para usar un item.`)
                                                .setColor(Colores.negro);

                                                for(let i = 0; i < stats.items.length; i++){
                                                    itemsEmbed.addField(`— ${stats.items[i].name}`, `**— ID**: \`${stats.items[i].id}\`.`)
                                                }

                                                message.channel.send(itemsEmbed);
                                            } else {
                                                // USAR UN ITEM
                                                let idUse = args[1];

                                                DarkUse.findOne({
                                                    itemID: idUse
                                                }, (err, use) => {
                                                    if(err) throw err;

                                                    // verificar que tenga ese item
                                                    if(!stats.items.find(x => x.id === Number(idUse))) return message.channel.send(noItem);

                                                    if(!use) return message.channel.send(`[02] Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas usar tu item... :)`)

                                                    let item = stats.items.find(x => x.id === Number(idUse));

                                                    let action = use.info.action;;
                                                    let index = stats.items.indexOf(item);
                                                    let efecto = use.info.extra.effect;
                                                    let duracion = use.info.extra.duration;
                                                    let cantidad = use.info.extra.quantity;
                                                    let victim;
                                                    
                                                    switch(use.info.thing){
                                                        case "jeffros":
                                                            break;

                                                        case "warns":
                                                            // /ds items 3 @jefstj
                                                            if(!message.mentions.users.first()){
                                                                return message.reply(`menciona con quien quieras interactuar con este item. \`${prefix}darkshop info ${use.itemID}\`.`)
                                                            } else {
                                                                victim = message.guild.member(message.mentions.users.first());

                                                                let skipped2 = new Discord.MessageEmbed()
                                                                .setAuthor(`| Interacción`, Config.darkLogoPng)
                                                                .setDescription(`**—** ¡**${author.tag}** se ha volado la Firewall \`(${stats.accuracy}%)\` y ha usado el item \`${stats.items[index].name}\` en **${victim.user.tag}**!`)
                                                                .setColor(Colores.negro)
                                                                .setFooter(`${stats.items[index].name} para ${victim.user.tag}`)
                                                                .setTimestamp();

                                                                let success2 = new Discord.MessageEmbed()
                                                                .setAuthor(`| Interacción`, Config.darkLogoPng)
                                                                .setDescription(`**—** ¡**${author.tag}** ha usado el item \`${stats.items[index].name}\` en **${victim.user.tag}**!`)
                                                                .setColor(Colores.negro)
                                                                .setFooter(`${stats.items[index].name} para ${victim.user.tag}`)
                                                                .setTimestamp();

                                                                let fail2 = new Discord.MessageEmbed()
                                                                .setAuthor(`| Amenaza`, Config.darkLogoPng)
                                                                .setDescription(`**—** ¡**${author.tag}** ha querido usar el item \`${stats.items[index].name}\` en **${victim.user.tag}** pero NO HA FUNCIONADO!`)
                                                                .setColor(Colores.negro)
                                                                .setFooter(`${stats.items[index].name} para ${victim.user.tag}`)
                                                                .setTimestamp();

                                                                // revisar qué tipo de efecto tiene
                                                                if(efecto === "negative"){
                                                                    // revisar si victim tiene un firewall activa
                                                                    Stats.findOne({
                                                                        userID: victim.id
                                                                    }, (err, victimStats) => {
                                                                        if(err) throw err;

                                                                        if(!victimStats){
                                                                            if(!victim.roles.cache.find(x => x.id === dsRole.id)){
                                                                                return dsChannel.send(fail2);
                                                                            } else {
                                                                                Warns(victim, cantidad);

                                                                                dsChannel.send(success2);
        
                                                                                //eliminar item del autor
                                                                                stats.items.splice(index, 1);
                                                                                return stats.save();
                                                                            }
                                                                        } else {
                                                                            if(victimStats.items.length === 0){ // tiene cuenta pero no items, proseguir
                                                                                Warns(victim, cantidad);                                                                                
                                                                                dsChannel.send(success2);

                                                                                //eliminar item del autor
                                                                                stats.items.splice(index, 1);
                                                                                return stats.save();
                                                                            }

                                                                            if(victimStats.items.find(x => x.name === "Firewall")){ // si encuentra un item con nombre "Firewall", revisar si está activo
                                                                                let firewall = victimStats.items.find(x => x.name === "Firewall");    
                                                                                let firewallIndex = victimStats.items.indexOf(firewall);

                                                                                if(victimStats.items[firewallIndex].active === true){
                                                                                    let skip2 = SkipFirewall();

                                                                                    console.log(skip2);

                                                                                    if(skip2 == true){ // skip firewall
                                                                                        Warns(victim, cantidad);                                                                                
                                                                                        dsChannel.send(skipped2);

                                                                                        //eliminar item del autor
                                                                                        stats.items.splice(index, 1);
                                                                                        return stats.save();
                                                                                    } else {
                                                                                        dsChannel.send(fail2);

                                                                                        // eliminar firewall
                                                                                        victimStats.items.splice(firewallIndex, 1);
                                                                                        victimStats.save();

                                                                                        //eliminar item del autor
                                                                                        stats.items.splice(index, 1);
                                                                                        return stats.save();
                                                                                    }
                                                                                } else {
                                                                                    Warns(victim, cantidad);                                                                                
                                                                                    dsChannel.send(success2);

                                                                                    //eliminar item del autor
                                                                                    stats.items.splice(index, 1);
                                                                                    return stats.save();
                                                                                }
                                                                            } else { // no tienen ningun item con nombre firewall
                                                                                Warns(victim, cantidad);                                                                                
                                                                                dsChannel.send(success2);

                                                                                //eliminar item del autor
                                                                                stats.items.splice(index, 1);
                                                                                return stats.save();
                                                                            }
                                                                        }
                                                                    })
                                                                } else {
                                                                    // no es negativo agregar warns
                                                                    Warns();
                                                                    dsChannel.send(success2);

                                                                    //eliminar item del autor
                                                                    stats.items.splice(index, 1);
                                                                    return stats.save();
                                                                }
                                                            }

                                                            function Warns(v, c){
                                                                Warn.findOne({
                                                                    userID: v.id
                                                                }, (err, victimWarns) => {
                                                                    if(err) throw err;

                                                                    if(!victimWarns) {
                                                                        const newWarn = new Warn({
                                                                            userID: v.id,
                                                                            warns: c
                                                                        });
                                                                        newWarn.save();
                                                                    } else {
                                                                        victimWarns.warns += cantidad;
                                                                        victimWarns.save();
                                                                    }
                                                                })
                                                            }
                                                            break;

                                                        case "role":
                                                            let role = guild.roles.cache.find(x => x.id === use.info.thingID);

                                                            // /ds items 2 @jefroyt
                                                            if(!message.mentions.users.first()){
                                                                return message.reply(`menciona con quien quieras interactuar con este item. \`${prefix}darkshop info ${use.itemID}\`.`)
                                                            } else {
                                                                victim = message.guild.member(message.mentions.users.first());

                                                                let skipped3 = new Discord.MessageEmbed()
                                                                .setAuthor(`| Interacción`, Config.darkLogoPng)
                                                                .setDescription(`**—** ¡**${author.tag}** se ha volado la Firewall \`(${stats.accuracy}%)\` y ha usado el item \`${stats.items[index].name}\` en **${victim.user.tag}**!`)
                                                                .setColor(Colores.negro)
                                                                .setFooter(`${stats.items[index].name} para ${victim.user.tag}`)
                                                                .setTimestamp();

                                                                let success3 = new Discord.MessageEmbed()
                                                                .setAuthor(`| Interacción`, Config.darkLogoPng)
                                                                .setDescription(`**—** ¡**${author.tag}** ha usado el item \`${stats.items[index].name}\` en **${victim.user.tag}**!`)
                                                                .setColor(Colores.negro)
                                                                .setFooter(`${stats.items[index].name} para ${victim.user.tag}`)
                                                                .setTimestamp();

                                                                let fail3 = new Discord.MessageEmbed()
                                                                .setAuthor(`| Amenaza`, Config.darkLogoPng)
                                                                .setDescription(`**—** ¡**${author.tag}** ha querido usar el item \`${stats.items[index].name}\` en **${victim.user.tag}** pero NO HA FUNCIONADO!`)
                                                                .setColor(Colores.negro)
                                                                .setFooter(`${stats.items[index].name} para ${victim.user.tag}`)
                                                                .setTimestamp();


                                                                // revisar si el efecto es negativo.
                                                                if(efecto === "negative"){
                                                                    // es negativo, entonces revisar si "victim" tiene firewall ACTIVA.

                                                                    Stats.findOne({
                                                                        userID: victim.id
                                                                    }, (err, victimStats) => {
                                                                        if(err) throw err;

                                                                        if(!victimStats){
                                                                            if(!victim.roles.cache.find(x => x.id === dsRole.id)){
                                                                                return dsChannel.send(fail3);
                                                                            } else {
                                                                                dsChannel.send(success3);
                                                                                victim.roles.add(role);
    
                                                                                //eliminar item del autor
                                                                                stats.items.splice(index, 1);
                                                                                stats.save();

                                                                                // tiene una duración?
                                                                                return Duration(duracion, role.id, victim);
                                                                            }
                                                                        } else {
                                                                            if(victimStats.items.length === 0){ // tiene cuenta pero no items, proseguir
                                                                                dsChannel.send(success3);
                                                                                victim.roles.add(role);

                                                                                //eliminar item del autor
                                                                                stats.items.splice(index, 1);
                                                                                stats.save();

                                                                                // tiene una duración?
                                                                                return Duration(duracion, role.id, victim);
                                                                            }

                                                                            if(victimStats.items.find(x => x.name === "Firewall")){ // si encuentra un item con nombre "Firewall", revisar si está activo
                                                                                let firewall = victimStats.items.find(x => x.name === "Firewall");    
                                                                                let firewallIndex = victimStats.items.indexOf(firewall);

                                                                                if(victimStats.items[firewallIndex].active === true){
                                                                                    let skip3 = SkipFirewall();

                                                                                    if(skip3 == true){ // skip firewall
                                                                                        dsChannel.send(skipped3);
                                                                                        victim.roles.add(role);

                                                                                        //eliminar item del autor
                                                                                        stats.items.splice(index, 1);
                                                                                        stats.save();

                                                                                        // tiene una duración?
                                                                                        return Duration(duracion, role.id, victim);
                                                                                    } else {
                                                                                        dsChannel.send(fail3);

                                                                                        // eliminar firewall
                                                                                        victimStats.items.splice(firewallIndex, 1);
                                                                                        victimStats.save();

                                                                                        //eliminar item del autor
                                                                                        stats.items.splice(index, 1);
                                                                                        return stats.save();
                                                                                    }
                                                                                } else {
                                                                                    dsChannel.send(success3);
                                                                                    victim.roles.add(role);

                                                                                    //eliminar item del autor
                                                                                    stats.items.splice(index, 1);
                                                                                    stats.save();

                                                                                    // tiene una duración?
                                                                                    return Duration(duracion, role.id, victim);
                                                                                }
                                                                            } else { // no tienen ningun item con nombre firewall
                                                                                dsChannel.send(success3);
                                                                                victim.roles.add(role);

                                                                                //eliminar item del autor
                                                                                stats.items.splice(index, 1);
                                                                                stats.save();

                                                                                // tiene una duración?
                                                                                return Duration(duracion, role.id, victim);
                                                                            }
                                                                        }
                                                                    })
                                                                } else {
                                                                    // no es negativo, dar el rol
                                                                    victim.roles.add(role);
                                                                    dsChannel.send(success3);

                                                                    //eliminar item del autor
                                                                    stats.items.splice(index, 1);
                                                                    stats.save();

                                                                    // tiene una duración?
                                                                    return Duration(duracion, role.id, victim);
                                                                    
                                                                }
                                                            }

                                                            function Duration(roleDuration, roleID, victimMember){
                                                                let role = guild.roles.cache.find(x => x.id === roleID);
                                                                if(roleDuration != "permanent"){
                                                                    // agregar una global data con la fecha

                                                                    let hoy = new Date();
                                                                    const newData = new GlobalData({
                                                                        info: {
                                                                            type: "roleDuration",
                                                                            roleID: roleID,
                                                                            userID: victimMember.id,
                                                                            since: hoy,
                                                                            duration: roleDuration
                                                                        }
                                                                    })

                                                                    newData.save();

                                                                    // timeout, por si pasa el tiempo antes de que el bot pueda reiniciarse
                                                                    setTimeout(function(){
                                                                        victimMember.roles.remove(role);

                                                                        GlobalData.findOneAndDelete({
                                                                            "info.type": "roleDuration",
                                                                            roleID: roleID,
                                                                            userID: victimMember.id,
                                                                            since: hoy,
                                                                            duration: roleDuration
                                                                        });
                                                                    }, roleDuration);

                                                                } else {
                                                                    // es permanente, no hacer nada
                                                                    return;
                                                                }
                                                            }


                                                            break;

                                                        case "item":
                                                            let action4 = use.info.action;
                                                            let index4 = stats.items.indexOf(item);
                                                            if(item.active === false && action4 === "add"){ // entonces activarlo.
                                                                // buscarlo

                                                                stats.items[index4].active = true;
                                                                stats.markModified("items");
                                                                stats.save()
                                                                .then(a => console.log(a))
                                                                .catch(err => console.log(err));

                                                                let activated = new Discord.MessageEmbed()
                                                                .setAuthor(`| Listo`, Config.darkLogoPng)
                                                                .setDescription(`**—** Se ha activado el item **${stats.items[index].name}**.`)
                                                                .setColor(Colores.negro);
                                                                return message.channel.send(activated)
                                                            } else {
                                                                return message.reply("este item ya está activo en tu cuenta.")
                                                            }
                                                            break;
                                                    }
                                                })
                                                
                                            }
                                        }
                                    })
                                }
                            })
                            
                            break;
                        default:

                            let error = new Discord.MessageEmbed()
                            .setAuthor(`| Error`, Config.darkLogoPng)
                            .setDescription(
                            `**—** No encontré ningún item para comprar con esa id...`
                            )
                            .setColor(Colores.negro);

                            if(isNaN(args[0])) return message.channel.send(error);
                            itemID = args[0];

                            DarkUse.findOne({
                                itemID: itemID
                            }, (err, use) => {
                                if(err) throw err;

                                Items.findOne({
                                    id: itemID
                                }, (err, item) => {
                                    if(err) throw err;

                                    Stats.findOne({
                                        userID: author.id
                                    }, (err, stats) => {
                                        if(err) throw err;

                                        if(!stats) return message.reply("aún no tienes una cuenta, cambia unos cuantos Jeffros por DarkJeffros antes de venir a comprar.");
                                        
                                        if(!item){
                                            return message.reply("ese item no existe.")
                                        } else {
                                            if(!use){ // si no está listo para usar
                                                return message.channel.send(`Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas comprar tu item :)`);
                                            }

                                            // variables & embeds
                                            let precio = Number(item.itemPrice);
                                            
                                            let doesntHaveEnough = new Discord.MessageEmbed()
                                            .setAuthor(`| Error`, Config.darkLogoPng)
                                            .setDescription(
                                            `**—** Necesitas **${Emojis.Dark}${precio}** para comprar \`${item.itemName}\`. Tienes **${Emojis.Dark}${stats.djeffros}**.`
                                            )
                                            .setColor(Colores.negro);

                                            let hasThisItem = new Discord.MessageEmbed()
                                            .setAuthor(`| Error`, Config.darkLogoPng)
                                            .setDescription(
                                            `**—** Ya tienes \`${item.itemName}\`, úsalo con \`${prefix}ds items ${item.id}\`.`
                                            )
                                            .setColor(Colores.negro);

                                            // tiene darkjeffros suficientes?
                                            if(stats.djeffros < precio) return message.channel.send(doesntHaveEnough);

                                            // verificar si ya tiene lo que está comprando

                                            // buscar si hay algún item con esa id
                                            for (let x = 0; x < stats.items.length; x++){
                                                if(stats.items != undefined && stats.items[x].id === item.id){
                                                    return message.channel.send(hasThisItem);
                                                }
                                            }
                                                    
                                                // si no tiene ese item
                                                x = stats.items.length;
                                                // confirmar pago
                                                let buyEmbed = new Discord.MessageEmbed()
                                                .setAuthor(`| Compra`, Config.darkLogoPng)
                                                .setColor(Colores.blanco)
                                                .setDescription(
                                                    `
                \`▸\` ¿Estás seguro de comprar \`${item.itemName}\` por **${Emojis.Dark}${precio}**?
                \`▸\` Reacciona de acuerdo a tu preferencia.`
                                                )
                                                .setFooter(
                                                    `▸ Esta compra no se puede devolver.`,
                                                    "https://cdn.discordapp.com/emojis/494267320097570837.png"
                                                );

                                                message.channel.send(buyEmbed).then(msg => {
                                                msg
                                                    .react(":allow:558084462232076312")
                                                    .then(r => {
                                                    msg.react(":denegar:558084461686947891");
                                                    });

                                                let cancelEmbed = new Discord.MessageEmbed()
                                                    .setDescription(`Cancelado.`)
                                                    .setColor(Colores.nocolor);

                                                const yesFilter = (reaction, user) =>
                                                    reaction.emoji.id ===
                                                    "558084462232076312" &&
                                                    user.id === message.author.id;
                                                const noFilter = (reaction, user) =>
                                                    reaction.emoji.id ===
                                                    "558084461686947891" &&
                                                    user.id === message.author.id;

                                                const yes = msg.createReactionCollector(
                                                    yesFilter,
                                                    { time: 60000 }
                                                );
                                                const no = msg.createReactionCollector(
                                                    noFilter,
                                                    {
                                                    time: 60000
                                                    }
                                                );

                                                yes.on("collect", r => {
                                                    // agregar a la lista de items

                                                    if(stats.items.length === 0){
                                                        stats.items = [
                                                            {
                                                                "id": item.id,
                                                                "name": item.itemName,
                                                                "active": false
                                                            }
                                                        ];

                                                    } else {
                                                        stats.items.push({"id": item.id, "name": item.itemName, "active": false})
                                                    }

                                                    stats.djeffros -= precio;
                                                    stats.save();

                                                    let useEmbed = new Discord.MessageEmbed()
                                                    .setAuthor(`| Listo!`, Config.darkLogoPng)
                                                    .setDescription(
                                                        `
                \`▸\` Pago realizado con éxito.
                \`▸\` Compraste: \`${item.itemName}\` por **${Emojis.Dark}${precio}**.
                \`▸ Úsalo con '${prefix}ds items ${item.id}'\`.
                \`▸\` Ahora tienes: **${Emojis.Dark}${stats.djeffros}**.`
                                                    )
                                                    .setColor(Colores.negro);

                                                    return msg.edit(useEmbed).then(() => {
                                                    msg.reactions.removeAll();
                                                    });
                                                });

                                                no.on("collect", r => {
                                                    return msg.edit(cancelEmbed).then(a => {
                                                    msg.reactions.removeAll();
                                                    message.delete();
                                                    a.delete({timeout: ms("20s")});
                                                    });
                                                });
                                            });
                                        }
                                    })
                                })
                            })
                    }
                }
                    
                } else { // si no los cumple
                    r = [
                        "{you}... No estás listo.",
                        "No tienes el valor para hacerlo.",
                        "Esto no va a terminar bien para ti, {you}."
                    ];

                    res = r[Math.floor(Math.random() * r.length)];

                    let desc = res.replace(
                        new RegExp("{you}", "g"),
                        `**${author.tag}**`
                    );

                    let notReady = new Discord.MessageEmbed()
                    .setColor(Colores.rojo)
                    .setDescription(desc)
                    .setFooter("▸ Vuelve cuando seas nivel 5.");

                    return message.channel.send(notReady);
                }
            })
    })

  })

    function SkipFirewall(){
        Stats.findOne({
            userID: author.id
        }, (err, attacker) => {
            if(err) throw err;

            let accu = attacker.accuracy;
            let sk = chance.bool({likelihood: accu});

            console.log(sk);
            return sk;
        })
    }
}

module.exports.help = {
    name: "darkshop",
    alias: "ds"
}
