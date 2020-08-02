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
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");

const Stats = require("../modelos/darkstats.js");
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
            .setAuthor(`| DarkShop`, Config.darkLogoPng)
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
        }

        switch(args[0]){
            case "bal":
                // buscar el saldo del usuario
                Stats.findOne({
                    userID: author.id
                }, (err, stats) => {
                    if(err) throw err;

                    if(!stats){
                        let error = new Discord.MessageEmbed()
                        .setAuthor(`| Error`, Config.darkLogoPng)
                        .setDescription(`**—** DarkJeffros**: ?
**— Precisión**: ?
**— Items**: ?`)
                        .setColor(Colores.negro);

                        message.channel.send(error)
                    } else {
                        let stats = new Discord.MessageEmbed()
                        .setAuthor(`| Estadísiticas del usuario N°${author.id}`)
                        .setDescription(`**—** DarkJeffros**: ${Emojis.Dark}${stats.djeffros}.
**— Precisión**: ${stats.accuracy}%
**— Items**: Usa \`${prefix}d̶̪͍̏̉̉͒a̸̺͖͓͉̯̝̔̒͛̏͝r̴͖̗͉̬̼̊̇͝ͅk̸̢͕̠͊̄̀̊̐͜s̵̲̅͑̓h̴̢̰̻̜͙́o̶̱͒́̾p̷̮̞͍̲͐̏̉̊͋̂ ̷̹̃̑̇͘̚í̷̯t̶̮̙̙͙͎͉̑̈̌̀̈e̴̛̜̱͛̌m̴̙͕͇̻̹̭͑̌s̵̡̧̻̯̐̈́͌̆̆͝\``)
                        .setColor(Colores.negro);
                        
                        message.channel.send(stats)

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
                            `▸ El uso correcto es: /darkshop add <nombre> <precio> (@role requerido o ID)
**—** Para los roles, si no se necesita, rellenar con "\`na\`".`
                        )
                        .setColor(Colores.nocolor);

                        if (!args[1]) return message.channel.send(errorEmbed);
                        if (!args[2]) return message.channel.send(errorEmbed);

                        let nameItem = args[1];
                        let priceItem = args[2];

                        let lastID = c + plus;

                        const newItem = new Items({
                        serverID: guild.id,
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
                .setDescription(`▸ El uso correcto es: /shop remove <id del item>`);

                if (!args[1]) return message.channel.send(errorEmbed2);

                Items.findOne(
                    {
                    serverID: guild.id,
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
                            .setAuthor(`| Item ${data.id}`, guild.iconURL())
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

            case "edit":
                // editar un darkitem
                if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
                let errorEmbed3 = new Discord.MessageEmbed()
                  .setAuthor(`| Error`, Config.errorPng)
                  .setDescription(
                    `▸ El uso correcto es: /shop edit <id> <nombre, precio, etc> <nuevo>`
                  );
          
                if (!args[1]) return message.channel.send(errorEmbed3);
                if (!args[2]) return message.channel.send(errorEmbed3);
                if (!args[3]) return message.channel.send(errorEmbed3);
          
                let idItem = args[1];
                let toEdit = args[2].toLowerCase();
                let newData;
          
                Items.findOne(
                  {
                    serverID: guild.id,
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
