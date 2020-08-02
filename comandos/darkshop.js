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

const Items = require("../modelos/darkitems.js");


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

  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return console.log("noxD");

  const itemPerPage = 3;

  // ¿es nivel 5?
  
  Exp.findOne({
      userID: author.id
  }, (err, exp) => {
      if(err) throw err;

      if(exp.level >= 5){ // si cumple los requisitos

        // si no hay args, muestra la página principal
        if(!args[0]){
            let tienda = new Discord.MessageEmbed()
            .setAuthor(`| Darkshop`, author.displayAvatarURL())
            .setColor(Colores.negro)
            .setDescription(`**—** Bienvenido a la DarkShop. \`${prefix}darkshop <ID del item>\`.
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
                        let pagn = "1";
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

                                if (i + 1 === items.length){
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
                                                .setAuthor(`| Darkshop`, author.displayAvatarURL())
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
                                                    console.log(inicio);

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
                                                            msg.edit(embed);
                                                        }
                                                    }
                                                });
                                            });

                                            // si se reacciona adelante
                                            forwards.on("collect", r => {
                                                if(pagn === totalpags) return;;
                                                pagn++;

                                                let embed = new Discord.MessageEmbed()
                                                .setAuthor(`| Darkshop`, author.displayAvatarURL())
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
                                                    console.log(inicio);

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
                                                            msg.edit(embed);
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
        }

        switch(args[0]){
            case "info":
                // buscar la info del darkitem
                break;

            case "bal":
                // buscar el saldo del usuario
                break;

            case "add":
                // añadir un darkitem
                break;

            case "remove":
                // eliminar un darkitem
                break;

            case "edit":
                // editar un darkitem
                break;

            default:
                // comprar un item
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

}

module.exports.help = {
    name: "darkshop",
    alias: "ds"
}
