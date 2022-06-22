const Discord = require("discord.js");
const ms = require("ms");

const Config = require("../src/resources/base.json");
const Colores = require("../src/resources/colores.json");
const Emojis = require("../src/resources/emojis.json");
const { disableAwards, jeffreygID } = Config;

const User = require("../modelos/User.model.js");
const GlobalData = require("../modelos/globalData.js");
const AutoRole = require("../modelos/autorole.js");

module.exports = async (client, reaction, user) => {
    if (user.bot) return;

    const guild = reaction.message.guild;
    const channel = reaction.message.channel;
    const message = reaction.message;
    const member = guild.members.cache.get(user.id);

    // AUTOROLES
    AutoRole.findOne({
        serverID: guild.id,
        channelID: channel.id,
        messageID: message.id,
        emoji: reaction.emoji.id || reaction.emoji.name
    }, async (err, autorole) => {
        if (err) throw err;

        if(!autorole) return;
        const isCorrect = ((autorole.custom === 1 && reaction.emoji.id === autorole.emoji) || (autorole.custom === 0 && reaction.emoji.name === autorole.emoji)) ?? false;
    
        if(!isCorrect) return;
        
        const roleToAdd = guild.roles.cache.find(x => x.id === autorole.roleID);
        if(autorole.toggleGroup != "0"){ // es toggleable D:
            const sameGroup = await AutoRole.find({serverID: guild.id, toggleGroup: autorole.toggleGroup});
            
            if(sameGroup.length > 1){
                // hay varios toggles.
                // revisar si ha reaccionado con algún otro autorole con ese toggle.
    
                oldReaction:
                for (let k = 0; k < sameGroup.length; k++) {
                    const toggledAutorole = sameGroup[k];
    
                    let shouldNotHave = guild.roles.cache.find(x => x.id === toggledAutorole.roleID);
                    let oldReaction = toggledAutorole.emoji;
    
                    if(member.roles.cache.find(x => x.id === shouldNotHave.id)) {
                        await member.roles.remove(shouldNotHave); // eliminar el role
                        let oldC = guild.channels.cache.find(x => x.id === toggledAutorole.channelID);
                        let oldM = await oldC.messages.fetch(toggledAutorole.messageID);
    
                        let reactions = toggledAutorole.custom === 1 ? await oldM.reactions.cache.find(x => x.emoji.id === oldReaction) : await oldM.reactions.cache.find(x => x.emoji.name === oldReaction);
                        await reactions.users.remove(user.id);
    
                        break oldReaction;
                    }
                }
            }   
        }

        await member.roles.add(roleToAdd);
    });

    // AWARDS
    let silver = client.user.id === Config.testingJBID ? "880602500414201866" : Config.silverAward;
    let gold = client.user.id === Config.testingJBID ? "880602498224771092" : Config.goldAward;
    let platinium = client.user.id === Config.testingJBID ? "880602498195402812" : Config.platiniumAward;
    let hallChannel = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "483007967239602196") : guild.channels.cache.find(x => x.id === Config.hallChannel);
  
    let bots = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "537095712102416384") : guild.channels.cache.find(x => x.id === Config.botsChannel);
  
    let award;
    let price;
    let gift;
    let isAward = true;
    const hallOfFameEmbed = new Discord.MessageEmbed();
  
    if (message.attachments.size !== 0) {
      // Attachments are present.
      const firstAttachment = message.attachments.first();
  
      hallOfFameEmbed.setAuthor(message.author.tag, message.author.displayAvatarURL());
      hallOfFameEmbed.setImage(firstAttachment.url);
      hallOfFameEmbed.setDescription(`[★](${message.url}) ${message.content} [(archivo)](${firstAttachment.url})`);
    } else if (message.embeds.length != 0) {
      let firstEmbed = message.embeds[0];
      let msgEmbed;

      if(!firstEmbed.video && firstEmbed.url){ // es una imagen
        hallOfFameEmbed.setImage(firstEmbed.url)
        msgEmbed = firstEmbed.url;
      } else if(firstEmbed.video && !firstEmbed.thumbnail){ // es un link, que general un video reproducible
        msgEmbed = firstEmbed.url +"\n(vídeo)";
      } else if(firstEmbed.video && firstEmbed.thumbnail){ // es un gif
        hallOfFameEmbed.setImage(firstEmbed.thumbnail.url)
        msgEmbed = firstEmbed.url;
      } else { // cualquier otra cosa
        let incaseofField = "";
        
        firstEmbed.fields.forEach(function(field){
            incaseofField += `\n${field.name} ${field.value}`
        });

        msgEmbed = firstEmbed.description ?? incaseofField;
      }
  
      hallOfFameEmbed.setAuthor(message.author.tag, message.author.displayAvatarURL());
      hallOfFameEmbed.setDescription(`[★](${message.url}) ${msgEmbed}`);
    } else {
      hallOfFameEmbed.setAuthor(message.author.tag, message.author.displayAvatarURL());
      hallOfFameEmbed.setDescription(`[★](${message.url}) ${message.content}`);
    }
  
    let paid = new Discord.MessageEmbed()
    .setDescription("Pagado.")
    .setColor(Colores.nocolor);
  
    switch (reaction.emoji.id) {
      case silver: // ################### PLATA ###########################
        award = "plata";
        price = 100;
        hallOfFameEmbed.setColor("#8f8f8f");
        hallOfFameEmbed.setFooter(`▸ Premio de plata por ${user.tag}`);
        hallOfFameEmbed.setTimestamp();
        break;
  
      case gold:
        award = "oro";
        price = 500;
        gift = 100;
        hallOfFameEmbed.setColor("#FFD700");
        hallOfFameEmbed.setFooter(`▸ Premio de oro por ${user.tag}`);
        hallOfFameEmbed.setTimestamp();
        break;
  
      case platinium:
        award = "platino";
        price = 1800;
        gift = 700;
        hallOfFameEmbed.setColor("#21ffe5");
        hallOfFameEmbed.setFooter(`▸ Premio de platino por ${user.tag}`);
        hallOfFameEmbed.setTimestamp();
        break;
  
      default:
        isAward = false;
    }
  
    if(isAward && disableAwards === true && user.id != jeffreygID) {
      message.channel.messages.fetch(message.id).then(m => {
        let react = m.reactions.cache.get(
          reaction.emoji.name + ":" + reaction.emoji.id
        );
  
        react.remove(user.id);
      });
  
      return bots.send(`${user}, los awards actualmente están en mantenimiento, por favor intenta más tarde. :D`);
    } else if(isAward){
  
      let confirmation = new Discord.MessageEmbed()
      .setAuthor(`Confirmación`, Config.jeffreyguildIcon)
      .setDescription(`**—** ${user.tag}, ¿Estás seguro de darle a este usuario el premio de **__${award}__**?
**—**( **${Emojis.Jeffros}${price.toLocaleString('es-CO')}** )

*— Para más información de las recompensas de los premios [mira esto](https://discordapp.com/channels/447797737216278528/485191307346837507/668568017042538507).*`)
      .setColor(Colores.rojo);
    
      bots.send({content: `${user}`, embeds: [confirmation]}).then(msg => {
        msg.react(":allow:558084462232076312").then(() => {
          msg.react(":denegar:558084461686947891");
        });

        let cancelEmbed = new Discord.MessageEmbed()
        .setDescription(`Cancelado.`)
        .setColor(Colores.nocolor);

        const yesFilter = (reaction, userr) => reaction.emoji.id === "558084462232076312" && userr.id === user.id;
        const noFilter = (reaction, userr) => reaction.emoji.id === "558084461686947891" && userr.id === user.id;
        const collectorFilter = (reaction, userr) => (reaction.emoji.id === "558084461686947891" || reaction.emoji.id === "558084462232076312") && userr.id === user.id;

        const yes = msg.createReactionCollector({ filter: yesFilter, time: 60000 });
        const no = msg.createReactionCollector({ filter: noFilter, time: 60000 });
        const collectorAwards = msg.createReactionCollector({ filter: collectorFilter, time: 60000 });

        collectorAwards.on("collect", r => {
          collectorAwards.stop();
        });
        
        collectorAwards.on("end", r => {
          if(r.size > 0 && (r.size === 1 && r.first().me)) return;
          if (msg.reactions.cache.size > 0) {
            message.channel.messages.fetch(message.id).then(m => {
              let react = m.reactions.cache.get(reaction.emoji.id);
              
              react.users.remove(user.id);
            });

            msg.reactions.removeAll();
            return msg.edit({content: null, embeds: [cancelEmbed]}).then(e => {
              setTimeout(() => {
                e.delete()
              }, ms("10s"));
            });
          } else {
            return;
          }
        });

        yes.on("collect", async r => {
          msg.reactions.removeAll();

          let user_author = await User.findOne({ // buscar al que paga el premio
            user_id: user.id,
            guild: guild.id
          });

          let user_reciever = await User.findOne({ // buscar el que recibe el premio
            user_id: user.id,
            guild_id: guild.id
          });

          if (!user_author || user_author.economy.global.jeffros < price) { // si no existe un documento con jeffros o son insuficientes
            return msg.edit({content: `No tienes **${Emojis.Jeffros}${price.toLocaleString('es-CO')}**.`, embeds: null});
          }

          if (award === "oro" || award === "platino") { // si el award es de oro o platino
            if (user_reciever === user_author) { // si es el mismo usuario
              user_reciever.economy.global.jeffros -= price - gift;

              msg.edit({content: null, embeds: [paid]}).then(m => {
                setTimeout(() => {
                  m.delete()
                }, ms("4s"));
              });
              return hallChannel.send({embeds: [hallOfFameEmbed]});
            }

            if (!user_reciever) {
              const newUser = new User({
                user_id: message.author.id,
                guild: guild.id,
                economy: {
                  global: {
                    jeffros: gift
                  }
                }
              });

              user_author.economy.global.jeffros -= price;
              await newUser.save();
              await user_author.save();

              // despues del pago

              msg.edit({content: null, embeds: [paid]}).then(m => {
                setTimeout(() => {
                  m.delete()
                }, ms("4s"));
              });
              return hallChannel.send({embeds: [hallOfFameEmbed]});
            } else {
              user_author.economy.global.jeffros -= price;
              user_reciever.economy.global.jeffros += gift;

              await user_reciever.save();
              await user_author.save();

              // despues del pago

              msg.edit({content: null, embeds: [paid]}).then(m => {
                setTimeout(() => {
                  m.delete()
                }, ms("4s"));
              });
              return hallChannel.send({embeds: [hallOfFameEmbed]});
            }
          } else {
            // SI EL PREMIO ES SILVER ENTONCES
            user_author.economy.global.jeffros -= price;

            await user_author.save();

            msg.edit({content: null, embeds: [paid]}).then(m => {
              msg.reactions.removeAll();

              setTimeout(() => {
                m.delete();
              }, ms("4s"));
            });
            return hallChannel.send({embeds: [hallOfFameEmbed]});
          }
        });

        no.on("collect", r => {
          message.channel.messages.fetch(message.id).then(m => {
            let react = m.reactions.cache.get(reaction.emoji.id);

            react.users.remove(user.id);
          });

          return msg.edit({content: null, embeds: [cancelEmbed]}).then(a => {
            msg.reactions.removeAll();
            setTimeout(() => {
              a.delete();
            }, ms("10s"));
          });
        });
      });
    }

    // ENCUESTAS
    GlobalData.findOne({
      "info.type": "temporalPoll",
      "info.guild_id": guild.id,
      "info.message_id": message.id
    }, (err, poll) => {
      if(err) throw err;

      const reactionfilter = x => x.emoji.name === "✅" || x.emoji.name === "❌";

      if(!poll) return;
      if(!reactionfilter(reaction)) return reaction.users.remove(user);

      const reactionToFind = reaction.emoji.name === "❌" ? "✅" : "❌";

      const reactionToDelete = message.reactions.cache.find(x => x.emoji.name === reactionToFind);

      reactionToDelete.users.remove(user);
    })

}