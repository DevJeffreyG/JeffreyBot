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
const Warn = require("../modelos/warn.js");

const Items = require("../modelos/items.js");
const Purchased = require("../modelos/purchased.js");
const All = require("../modelos/allpurchases.js");
const Use = require("../modelos/use.js");
const Ignore = require("../modelos/ignore.js")

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  if (message.author.id != jeffreygID) return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let item;

  // if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

  // /usar id
  let errorEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Error`, Config.errorPng)
    .setDescription(
      `**—** El uso de este comando es con la id del item que compraste \`${prefix}usar <id>\`.`
    )
    .setColor(Colores.rojo);

  if (!args[0]) return message.channel.send(errorEmbed);

  if (args[0].toLowerCase() === "add") {
    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

    // /usar add <id> <action> <cosa> (id de cosa)
    /*
    
      serverID: String,
      itemID: String, // id en ITEMS.JS
      action: String, // "delete" para quitar X cosa || "add" para agregar X cosa
      thing: String, // "jeffros" || "warns" || "role"
      thingID: String,
      id: Number
  
    */
    let plus = 5325;
    Use.countDocuments({}, (err, c) => {
      Use.findOne(
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

          if (!args[1]) return message.reply(`falta la id.`);
          if (!args[2]) return message.reply(`falta la acción (add o delete).`);
          if (!args[3])
            return message.reply(
              `que se va a agregar o eliminar? (jeffros, warns, role)`
            );

          let cosaID = "na";
          if (args[3].toLowerCase() === "role" && !args[4]) {
            return message.reply(`falta la id del role.`);
          } else if (args[3].toLowerCase() === "role") {
            cosaID = args[4];
          }

          const newUse = new Use({
            serverID: guild.id,
            itemID: args[1],
            action: args[2].toLowerCase(),
            thing: args[3].toLowerCase(),
            thingID: cosaID,
            id: c + plus
          });

          newUse.save().catch(e => console.log(e));
          return message.react("✅");
        }
      );
    });
  } else if (args[0].toLowerCase() === "remove") {
    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

    // /usar remove <id>
    Use.findOneAndDelete({
      serverID: guild.id,
      id: args[1]
    });
  } else if (args[0].toLowerCase() === "edit") {
    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
  } else {
    Purchased.findOne(
      {
        userID: author.id,
        itemID: args[0]
      },
      (err, purchase) => {
        if (err) throw err;

        Items.findOne(
          {
            serverID: guild.id,
            id: args[0]
          },
          (err, item) => {
            if (err) throw err;

            let noItem = new Discord.MessageEmbed()
              .setAuthor(`| Error`, Config.errorPng)
              .setDescription(`**—** El item con id \`${args[0]}\` no existe.`)
              .setColor(Colores.rojo);

            if (!item) return message.channel.send(noItem);

            let noPurchase = new Discord.MessageEmbed()
              .setAuthor(`| Error`, Config.errorPng)
              .setDescription(`**—** Aún no has comprado \`${item.itemName}\`.`)
              .setColor(Colores.rojo);

            if (!purchase) return message.channel.send(noPurchase);

            /* 
        
          serverID: String,
          itemID: String, // id en ITEMS.JS
          action: String, // "delete" para quitar X cosa || "add" para agregar X cosa
          thing: String, //"warns"
          id: Number
          
        */
            Ignore.findOne({
              itemID: args[0]
            }, (err, ignored) => {
              let isIgnored = true;
              if(!ignored) isIgnored = false;
              
            Use.findOne(
              {
                serverID: guild.id,
                itemID: args[0]
              },
              (err, use) => {
                if (err) throw err;

                let action = use.action;
                let thing = use.thing;

                All.findOne(
                  {
                    userID: author.id,
                    itemID: args[0]
                  },
                  (err, all) => {
                    
                    if(!all && !isIgnored) {
                      const newAll = new All({
                        userID: author.id,
                        itemID: args[0],
                        quantity: 1
                      })
                      
                      newAll.save();
                    } else if(!ignored){
                      all.quantity += 1;
                      all.save()
                    }
                    
                    if (thing === "warns") {
                      Warn.findOne(
                        {
                          userID: author.id
                        },
                        (err, warns) => {
                          if (err) throw err;

                          if (action === "delete") {
                            if (warns.warns === 0)
                              return message.reply(
                                `no puedes usar este item porque no tienes warns que quitar.`
                              );

                            warns.warns -= 1;
                            warns.save();
                            purchase.remove();

                            let embed = new Discord.MessageEmbed()
                              .setAuthor(`| Listo`, guild.iconURL())
                              .setColor(Colores.verde).setDescription(`
\`▸\` ${item.replyMessage}
\`▸\` Ahora tienes: **${warns.warns}** warns.`);

                            return message.channel.send(embed);
                          } else {
                            warns.warns += 1;
                            warns.save();
                            purchase.remove();

                            let embed = new Discord.MessageEmbed()
                              .setAuthor(`| Listo`, guild.iconURL())
                              .setColor(Colores.verde).setDescription(`
\`▸\` ${item.replyMessage}
\`▸\` Ahora tienes: **${warns.warns}** warn(s).`);

                            return message.channel.send(embed);
                          }
                        }
                      );
                    } else if (thing === "role") {
                      if (use.thingID === "na")
                        return message.channel.send(
                          `Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas __usar__ tu item :)`
                        );

                      if (action === "delete") {
                        let r = guild.roles.cache.find(
                          x => x.id === use.thingID
                        );

                        if (
                          !message.member.roles.cache.find(x => x.id === r.id)
                        )
                          return message.reply(
                            `no tienes el rol que se quita al usar \`${item.itemName}\`.`
                          );

                        message.member.roles.remove(r).then(() => {
                          purchase.remove();
                          let embed = new Discord.MessageEmbed()
                            .setAuthor(`| Listo`, guild.iconURL())
                            .setColor(Colores.verde).setDescription(`
\`▸\` ${item.replyMessage}.`);

                          return message.channel.send(embed);
                        });
                      } else {
                        let r = guild.roles.cache.find(
                          x => x.id === use.thingID
                        );

                        if (message.member.roles.cache.find(x => x.id === r.id))
                          return message.reply(
                            `ya tienes el rol que se da al usar \`${item.itemName}\`.`
                          );

                        message.member.roles.add(r).then(() => {
                          purchase.remove();
                          let embed = new Discord.MessageEmbed()
                            .setAuthor(`| Listo`, guild.iconURL())
                            .setColor(Colores.verde).setDescription(`
\`▸\` ${item.replyMessage}.`);

                          return message.channel.send(embed);
                        });
                      }
                    } else {
                      return message.channel.send(
                        `Ups, ¡<@${Config.jeffreygID}>! Una ayudita por aquí...\n${author}, espera un momento a que Jeffrey arregle algo para que puedas __usar__ tu item :)`
                      );
                    }
                    
                  }
                );
              }
              
            );
          }
        );
      }
    );
                    })

  }
};

module.exports.help = {
  name: "usar",
  alias: "use"
};
