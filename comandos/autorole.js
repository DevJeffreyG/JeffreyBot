const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const AutoRole = require("../modelos/autorole.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {
  if (!message.content.startsWith(prefix)) return;

  // Variables
  let author = message.author;
  const guild = message.guild;

  // args
  let action; // 0
  let arRole; // 1
  let arEmoji; // 2
  let arChannel; // 3
  let arMessage; // 4

  let embed = new Discord.MessageEmbed()
    .setTitle(`${prefix}role`)
    .setColor(Colores.nocolor)
    .setDescription(
      `▸ El uso correcto es: ${prefix}autorole <add | remove | list> <@role o ID> <:emoji:> <#canal o ID> <[ID mensaje](https://support.discordapp.com/hc/es/articles/206346498--D%C3%B3nde-puedo-encontrar-mi-ID-de-usuario-servidor-mensaje)>`
    )
    .setFooter(`<> Obligatorio, () Opcional┊Alias: ${prefix}arole`);
  
  if(!args[0]) return message.channel.send(embed);

  action = args[0].toLowerCase();
  arRole = message.mentions.roles.first() || guild.roles.cache.get(args[1]);
  arEmoji = args[2];
  arChannel = message.mentions.channels.first() || guild.channels.cache.get(args[3]);
  arMessage = args[4];

  // Roles
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  
  // testing jeffrey bot verifier
  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

  // AutoRoles
  AutoRole.findOne(
    {
      serverID: guild.id
    },
    (err, roles) => {
      if (err) throw err;

      if (action === "add") {
        let newID;

        if (!arRole) return message.channel.send(embed);
        if (!arEmoji) return message.channel.send(embed);
        if (!arChannel) return message.channel.send(embed);
        if (!arMessage) return message.channel.send(embed);

        AutoRole.countDocuments({}, function(err, c) {
          let lastid = c + 1;

          AutoRole.findOne(
            {
              id: lastid
            },
            (err, found) => {
              if (err) throw err;
              console.log(lastid);
              if (!found) {
              } else {
                while (lastid === found.id) {
                  lastid = c + 1 + 1;
                  console.log("equal id");
                }
              }
              AutoRole.findOne(
                {
                  serverID: guild.id,
                  roleID: arRole.id,
                  emoji: arEmoji,
                  channelID: arChannel.id,
                  messageID: arMessage
                },
                (err, newautorole) => {
                  if (err) throw err;

                  let custom = 0;

                  // detectando si es personalizado el emoji
                  if (arEmoji.length > 5) {
                    let arEmoji2 = args[2].match(/\d/g); // sacando los números del emoji
                    arEmoji = arEmoji2.join("");
                    custom = 1;
                  }

                  if (!newautorole) {
                    const newARole = new AutoRole({
                      serverID: guild.id,
                      roleID: arRole.id,
                      emoji: arEmoji,
                      channelID: arChannel.id,
                      messageID: arMessage,
                      custom: custom,
                      id: lastid
                    });

                    newARole
                      .save()
                      .then(z => message.reply(`listo. **ID:** \`${lastid}\`.`))
                      .catch(e => console.log(e));

                    // reaccionando a ese mensaje
                    if (custom === 1) {
                      arChannel.messages.fetch(`${arMessage}`).then(msg => {
                        msg.react(client.emojis.cache.find(x => x.id === arEmoji));
                      });
                    } else {
                      arChannel.messages.fetch(`${arMessage}`).then(msg => {
                        msg.react(`${arEmoji}`);
                      });
                    }
                  } else {
                    return message.reply(
                      `ya existe un autorole con las mismas características.`
                    );
                  }
                }
              );
            }
          );
        });
      } else if (action === "remove") {
        AutoRole.findOne(
          {
            serverID: guild.id,
            id: args[1]
          },
          (err, autorole) => {
            if (err) throw err;

            if (!autorole) {
              message.reply(`no encontré ningún role automático con ese ID.`);
            } else {
              let ch = guild.channels.cache.get(autorole.channelID);

              if (autorole.custom === 1) {
                ch.messages.fetch(`${autorole.messageID}`).then(msg => {
                  msg.reactions.forEach(reaction =>
                    reaction.remove(client.user.id)
                  );
                });
              } else {
                ch.messages.fetch(`${autorole.messageID}`).then(msg => {
                  msg.reactions.forEach(reaction =>
                    reaction.remove(client.user.id)
                  );
                });
              }
              AutoRole.deleteOne({ serverID: guild.id, id: args[1] })
              .then(() => {
                message.react("✅");
              })
              .catch(
                err => console.log(err)
              );
            }
          }
        );
      } else if (action === "list"){
        AutoRole.find({
          serverID: guild.id
        }, (err, aroles) => {
          if(err) throw err;

          if(!aroles) return message.reply("Aún no hay autoroles en este servidor.");
          
          let listEmbed = new Discord.MessageEmbed()
          .setDescription(`*** Lista de todos los AutoRoles en este servidor.**`)
          .setColor(Colores.verde);

          for(let i = 0; i < aroles.length; i++){
            let role = guild.roles.cache.find(x => x.id === aroles[i].roleID);
            let rCh = guild.channels.cache.find(x => x.id === aroles[i].channelID);
            let msg = rCh.messages.fetch(aroles[i].messageID);

            listEmbed.addField(`— @${role.name}`, `**—** Canal: ${rCh}.\n**—** [Mensaje](${msg.url}).\n**—** Emoji: ${aroles[i].emoji}.\n**—** ID: \`${aroles[i].id}\`.`);
          }

          message.channel.send(listEmbed);
        })
      }
    }
  );
};

module.exports.help = {
  name: "autorole",
  alias: "arole"
};
