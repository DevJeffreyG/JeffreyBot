const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const AutoRole = require("../../modelos/autorole.js");
const ToggleGroup = require("../../modelos/toggleGroup.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
  name: "autorole",
  aliases: ["arole"],
  info: "Administrar autoroles",
  params: [
      {
        name: "action", display: "add | remove | edittoggle | toggle | list | sync", type: "Options", options: ["add", "remove", "edittoggle", "toggle", "list", "sync"], optional: false
      },
      {
        name: "autorole id", type: "Number", active_on: {param: "action", is: "remove"}, optional: false
      },
      {
        name: "autorole id", type: "Number", active_on: {param: "action", is: "toggle"}, optional: false
      },
      {
        name: "toggle group", display: "grupo de toggle", type: "Number", active_on: {param: "action", is: "toggle"}, optional: false
      },
      {
        name: "role", display: "@role | ID", active_on: {param: "action", is: "add"}, type: "Role", optional: false
      },
      {
        name: "emoji", display: ":emoji:", active_on: {param: "action", is: "add"}, type: "Emoji", optional: false
      },
      {
        name: "channel", display: "#canal | ID", active_on: {param: "action", is: "add"}, type: "Channel", optional: false
      },
      {
        name: "message", display: "[ID de mensaje](https://support.discordapp.com/hc/es/articles/206346498--D%C3%B3nde-puedo-encontrar-mi-ID-de-usuario-servidor-mensaje '¿Dónde puedo encontrar mi ID de usuario / servidor / mensaje?') | link", active_on: {param: "action", is: "add"}, type: "Message", requires_param: "channel", optional: false
      }
  ],
  userlevel: "ADMIN",
  category: "STAFF"
}

module.exports = {
  data: commandInfo,
  async execute(client, message, args){
    const { guild, author, prefix, executionInfo } = await Initialize(client, message);

    let response = await TutorialEmbed(commandInfo, executionInfo, args);
    let embed = await TutorialEmbed(commandInfo, executionInfo);
  
    if(response[0] === "ERROR") return console.log(response); // si hay algún error
  
    console.log("RESPONSE", response);
  
    // Comando
  
    // args
    const action = response.find(x => x.param === "action").data;
    let arRole, arEmoji, arChannel, arMessage, selectedAutoroleID;
    if(action === "add"){
      arRole = response.find(x => x.param === "role").data;
      arEmoji = response.find(x => x.param === "emoji").data; // 2
      arChannel = response.find(x => x.param === "channel").data; // 3
      arMessage = response.find(x => x.param === "message").data; // 4
    } else if(action === "remove"){
      selectedAutoroleID = response.find(x => x.param === "autorole id").data;
    } else if(action === "toggle"){
      autoroleID = response.find(x => x.param === "autorole id").data;
      toggleGroup = response.find(x => x.param === "toggle group").data;
    }
    
  
    // AutoRoles
    AutoRole.findOne({
        serverID: guild.id
    }, async (err, roles) => {
        if (err) throw err;
        if (action === "add") {
          let newID;
  
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
                    messageID: arMessage.id
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
                        arChannel.messages.fetch(arMessage.id).then(msg => {
                          msg.react(client.emojis.cache.find(x => x.id === arEmoji));
                        })
                        .catch(err => {
                          return message.reply("no encontré ese mensaje en ese canal, revísa tus datos.")
                        });
                      } else {
                        arChannel.messages.fetch(arMessage.id).then(msg => {
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
                        messageID: arMessage.id,
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
              id: selectedAutoroleID
            },
            (err, autorole) => {
              if (err) throw err;
  
              if (!autorole) {
                message.reply(`no encontré ningún role automático con ese ID.`);
              } else {
                let ch = guild.channels.cache.get(autorole.channelID);
  
                if (autorole.custom === 1) {
                  ch.messages.fetch(`${autorole.messageID}`).then(async msg => {
                    let toRemove = await msg.reactions.cache.get(autorole.emoji);
                    await toRemove.users.remove(client.user.id); // quitar la reacción del cliente
                  });
                } else {
                  ch.messages.fetch(`${autorole.messageID}`).then(async msg => {
                    let toRemove = await msg.reactions.cache.get(autorole.emoji);
                    await toRemove.users.remove(client.user.id); // quitar la reacción del cliente
                  });
                }
                AutoRole.deleteOne({ serverID: guild.id, id: selectedAutoroleID })
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
                return message.channel.send({embeds: [listEmbed]});
              }
            }
          })
        } else if(action === "toggle"){
          // /a toggle idAUTOROLE togglegroup
          embed.setDescription(`▸ ${prefix}autorole toggle <\`autorole id\`> <\`grupo de toggle\`>`)
          if(!args[1] || isNaN(args[1])){
              embed.setAuthor(`Error: autorole id`, Config.errorPng)
              return message.channel.send({embeds: [embed]})
          } else if(!args[2] || isNaN(args[2])) {
              embed.setAuthor(`Error: grupo de toggle`, Config.errorPng)
              return message.channel.send({embeds: [embed]})
          }
  
          if(!args[1] || isNaN(args[1])){
              embed.setAuthor(`Error: autorole id`, Config.errorPng)
              return message.channel.send({embeds: [embed]})
          } else if(!args[2] || isNaN(args[2])) {
              embed.setAuthor(`Error: grupo de toggle`, Config.errorPng)
              return message.channel.send({embeds: [embed]})
          }
  
        let toggleGroupQuery = await ToggleGroup.findOne({guild_id: message.guild.id, "info.group_id": toggleGroup});
        let autoroleQuery = await AutoRole.findOne({serverID: message.guild.id, id: autoroleID});
        
        if(!autoroleQuery) {
            embed.setAuthor(`Error: autorole id`, Config.errorPng)
            return message.channel.send({embeds: [embed]})
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
          changedGroup.setAuthor(`Listo`, Config.bienPng)
          changedGroup.setColor(Colores.verde)
          changedGroup.setDescription(`▸ Se ha agregado el autorole con id \`${autoroleID}\` al grupo ${toggleGroup}, "${toggleGroupQuery.info.group_name}".
          ▸ Cambia el nombre del grupo con: \`${prefix}autorole toggle edit <grupo id>\`.`);
        } else {
          let oldGroup = await ToggleGroup.findOne({guild_id: message.guild.id, "info.group_id": autoroleQuery.toggleGroup});
          changedGroup.setAuthor(`Listo`, Config.bienPng)
          changedGroup.setColor(Colores.rojo)
          changedGroup.setDescription(`▸ Se ha eliminado el autorole con id \`${autoroleID}\` del grupo ${autoroleQuery.toggleGroup}, "${oldGroup.info.group_name}".
          ▸ Cambia el nombre del grupo con: \`${prefix}autorole toggle edit <grupo id>\`.`);
        }
        
  
        autoroleQuery.toggleGroup = toggleGroup;
        await autoroleQuery.save();
  
        message.channel.send({embeds: [changedGroup]});
        } else if(action === "edittoggle"){
          embed.setDescription(`▸ ${prefix}autorole edit <\`grupo de toggle\`> <\`nuevo nombre\`>`)
          if(!args[1] || isNaN(args[1])) {
              embed.setAuthor(`Error: grupo de toggle`, Config.errorPng)
              return message.channel.send({embeds: [embed]})
          } else if (!args[2]) {
              embed.setAuthor(`Error: nuevo nombre`, Config.errorPng)
              return message.channel.send({embeds: [embed]})
          }

          let grouptoedit = Number(args[1]);
          let newname = args.join(" ").slice(args[0].length + args[1].length + 2);

          let groupQuery = await ToggleGroup.findOne({guild_id: message.guild.id, "info.group_id": grouptoedit})

          if(groupQuery){
              let changedGroup = new Discord.MessageEmbed()
              .setAuthor(`Listo`, Config.bienPng)
              .setColor(Colores.verde)
              .setDescription(`▸ Se ha cambiado el nombre del grupo \`${grouptoedit}\`.
              ▸ \`${groupQuery.info.group_name}\` ➜ \`${newname}\`.`);

              groupQuery.info.group_name = newname;
              groupQuery.markModified("info");

              await groupQuery.save();
              return message.channel.send({embeds: [changedGroup]});
          } else {
              embed.setAuthor(`Error: grupo de toggle`, Config.errorPng)
              return message.channel.send({embeds: [embed]})
          }
        } else if(action === "sync"){
          let syncQuery = await AutoRole.find({serverID: message.guild.id});
          if(!syncQuery || syncQuery.length == 0) return message.reply(`lo siento, no he encontrado autoroles en este servidor.`);
  
          for (let i = 0; i < syncQuery.length; i++) {
              const autorole = syncQuery[i];
  
              let channel = await message.guild.channels.cache.find(x => x.id === autorole.channelID) || null;
              let fetched = await channel.messages.fetch(autorole.messageID).catch(err => null);
              let emote = autorole.emoji;
              custom = autorole.isCustom;
  
              await react(custom, channel, fetched, emote);
          }
          message.react("✅");
        }
      }
    );
  }
}

async function react(isCustom, channel, message, emote) {
  if (isCustom) {
    channel.messages.fetch(message.id).then(msg => {
      msg.react(message.guild.emojis.cache.find(x => x.id === emote));
    })
    .catch(err => {
      return console.log(err);
    });
  } else {
    channel.messages.fetch(message.id).then(msg => {
      msg.react(`${emote}`);
    })
    .catch(err => {
      return console.log(err);
    });
  }
}

module.exports.help = {
  name: "autorole",
  alias: "arole"
};
