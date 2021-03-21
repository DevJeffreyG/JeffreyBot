const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const AutoRole = require("../modelos/autorole.js");
const ToggleGroup = require("../modelos/toggleGroup.js");

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
      `▸ El uso correcto es: ${prefix}autorole <add | remove | toggle | list> <@role o ID> <:emoji:> <#canal o ID> <[ID mensaje](https://support.discordapp.com/hc/es/articles/206346498--D%C3%B3nde-puedo-encontrar-mi-ID-de-usuario-servidor-mensaje)>`
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
  AutoRole.findOne({
      serverID: guild.id
  }, async (err, roles) => {
      if (err) throw err;
      if (action === "add") {
        let newID;

        if (!arRole) return message.channel.send(embed);
        if (!arEmoji) return message.channel.send(embed);
        if (!arChannel) return message.channel.send(embed);
        if (!arMessage) return message.channel.send(embed);

        AutoRole.countDocuments({}, function(err, c) {
          let lastid = c + 1;

          AutoRole.findOne({
              id: lastid
          }, (err, found) => {
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

                  if (!newautorole) { // si no existe ninguno con esto, hacerlo.

                    // reaccionando a ese mensaje
                    if (custom === 1) {
                      arChannel.messages.fetch(`${arMessage}`).then(msg => {
                        msg.react(client.emojis.cache.find(x => x.id === arEmoji));
                      })
                      .catch(err => {
                        return message.reply("no encontré ese mensaje en ese canal, revísa tus datos.")
                      });
                    } else {
                      arChannel.messages.fetch(`${arMessage}`).then(msg => {
                        msg.react(`${arEmoji}`);
                      })
                      .catch(err => {
                        return message.reply("no encontré ese mensaje en ese canal, revísa tus datos.")
                      });
                    }

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

                  } else {
                    return message.reply(`ya existe un autorole con las mismas características.`);
                  }
                });
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
                  msg.reactions.cache.each(reaction =>
                    reaction.remove(client.user.id)
                  );
                });
              } else {
                ch.messages.fetch(`${autorole.messageID}`).then(msg => {
                  msg.reactions.cache.each(reaction =>
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
        }, async (err, aroles) => {
          if(err) throw err;

          if(!aroles || aroles.length === 0) return message.reply("Aún no hay autoroles en este servidor.");
          
          let listEmbed = new Discord.MessageEmbed()
          .setDescription(`*** Lista de todos los AutoRoles en este servidor.**`)
          .setColor(Colores.verde);
          
          for(let i = 0; i < aroles.length; i++){
            let role = guild.roles.cache.find(x => x.id === aroles[i].roleID);
            let rCh = guild.channels.cache.find(x => x.id === aroles[i].channelID);
            let msg = await rCh.messages.fetch(`${aroles[i].messageID}`);

            if(!role || !rCh || !msg){
            } else {
              listEmbed.addField(`— @${role.name}`, `**—** Canal: ${rCh}.\n**—** [Mensaje](${msg.url}).\n**—** Emoji: ${aroles[i].emoji}.\n**—** ID: \`${aroles[i].id}\`.`);
            }

            if (i + 1 === aroles.length) {
              return message.channel.send(listEmbed);
            }
          }
        })
      } else if(action === "toggle"){
        // /a toggle idAUTOROLE togglegroup
        embed.setDescription(`▸ ${prefix}autorole toggle <\`autorole id\`> <\`grupo de toggle\`>`)
        if(!args[1] || isNaN(args[1])){
            embed.setAuthor(`| Error: autorole id`, Config.errorPng)
            return message.channel.send(embed)
        } else if(!args[2] || isNaN(args[2])) {
            embed.setAuthor(`| Error: grupo de toggle`, Config.errorPng)
            return message.channel.send(embed)
        }

        if(args[1].toLowerCase() === "edit"){
          embed.setDescription(`▸ ${prefix}autorole edit <\`grupo de toggle\`> <\`nuevo nombre\`>`)
          if(!args[2] || isNaN(args[2])) {
              embed.setAuthor(`| Error: grupo de toggle`, Config.errorPng)
              return message.channel.send(embed)
          } else if (!args[3]) {
              embed.setAuthor(`| Error: nuevo nombre`, Config.errorPng)
              return message.channel.send(embed)
          }

          let grouptoedit = Number(args[2]);
          let newname = args.join(" ").slice(args[0].length + args[1].length + args[2].length + 3);

          let groupQuery = await ToggleGroup.findOne({guild_id: message.guild.id, "info.group_id": grouptoedit})

          if(groupQuery){
              let changedGroup = new Discord.MessageEmbed()
              .setAuthor(`| Listo`, Config.bienPng)
              .setColor(Colores.verde)
              .setDescription(`▸ Se ha cambiado el nombre del grupo \`${grouptoedit}\`.
              ▸ \`${groupQuery.info.group_name}\` ➜ \`${newname}\`.`);

              groupQuery.info.group_name = newname;
              groupQuery.markModified("info");

              await groupQuery.save();
              return message.channel.send(changedGroup);
          } else {
              embed.setAuthor(`| Error: grupo de toggle`, Config.errorPng)
              return message.channel.send(embed)
          }
      }

      let autoroleID = args[1];
      let toggleGroup = args[2];

      let toggleGroupQuery = await ToggleGroup.findOne({guild_id: message.guild.id, "info.group_id": toggleGroup});
      let autoroleQuery = await AutoRole.findOne({serverID: message.guild.id, id: autoroleID});
      
      if(!autoroleQuery) {
          embed.setAuthor(`| Error: autorole id`, Config.errorPng)
          return message.channel.send(embed)
      }
      
      if(!toggleGroupQuery && toggleGroup != 0){
          const newGroup = new ToggleGroup({
              guild_id: message.guild.id,
              info: {
                  group_name: `Grupo ${toggleGroup}`,
                  group_id: toggleGroup
              }
          });

          await newGroup.save();
          toggleGroupQuery = await ToggleGroup.findOne({guild_id: message.guild.id, "info.group_id": toggleGroup});
      }

      let changedGroup = new Discord.MessageEmbed();

      if(toggleGroup != 0){
        changedGroup.setAuthor(`| Listo`, Config.bienPng)
        changedGroup.setColor(Colores.verde)
        changedGroup.setDescription(`▸ Se ha agregado el autorole con id \`${autoroleID}\` al grupo ${toggleGroup}, "${toggleGroupQuery.info.group_name}".
        ▸ Cambia el nombre del grupo con: \`${prefix}autorole toggle edit <grupo id>\`.`);
      } else {
        let oldGroup = await ToggleGroup.findOne({guild_id: message.guild.id, "info.group_id": autoroleQuery.toggleGroup});
        changedGroup.setAuthor(`| Listo`, Config.bienPng)
        changedGroup.setColor(Colores.rojo)
        changedGroup.setDescription(`▸ Se ha eliminado el autorole con id \`${autoroleID}\` del grupo ${autoroleQuery.toggleGroup}, "${oldGroup.info.group_name}".
        ▸ Cambia el nombre del grupo con: \`${prefix}autorole toggle edit <grupo id>\`.`);
      }
      

      autoroleQuery.toggleGroup = toggleGroup;
      await autoroleQuery.save();

      message.channel.send(changedGroup);
      }
    }
  );
};

module.exports.help = {
  name: "autorole",
  alias: "arole"
};
