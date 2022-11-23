const Discord = require("discord.js");
const ms = require("ms");

const { Config, Colores } = require("../src/resources");
const { Embed } = require("../src/utils");
const { disableAwards, jeffreygID } = Config;

const { Users, GlobalDatas, Guilds } = require("mongoose").models;

module.exports = async (client, reaction, user) => {
    if (user.bot) return;
    const { Emojis } = client;

    const guild = reaction.message.guild;
    const channel = reaction.message.channel;
    const message = await channel.messages.fetch(reaction.message.id);
    const member = guild.members.cache.get(user.id);

    // AUTOROLES
    const doc = await Guilds.getOrCreate(guild.id);
    doc.workerAddAutoRole(message, reaction, user)

    // ENCUESTAS
    GlobalDatas.findOne({
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

    // AWARDS
    // REWORK NEEDED
    return;
    let silver = client.user.id === Config.testingJBID ? "880602500414201866" : Config.silverAward;
    let gold = client.user.id === Config.testingJBID ? "880602498224771092" : Config.goldAward;
    let platinium = client.user.id === Config.testingJBID ? "880602498195402812" : Config.platiniumAward;
    let hallChannel = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "483007967239602196") : guild.channels.cache.find(x => x.id === Config.hallChannel);
  
    let bots = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "537095712102416384") : guild.channels.cache.find(x => x.id === Config.botsChannel);
  
    let award;
    let price;
    let gift;
    let isAward = true;
    const hallOfFameEmbed = new Embed();
  
    if (message.attachments.size !== 0) {
      // Attachments are present.
      const firstAttachment = message.attachments.first();
  
      hallOfFameEmbed.defAuthor({text: message.author.tag, icon: message.author.displayAvatarURL()});
      hallOfFameEmbed.setImage(firstAttachment.url);
      hallOfFameEmbed.defDesc(`[★](${message.url}) ${message.content} [(archivo)](${firstAttachment.url})`);
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
  
      hallOfFameEmbed.defAuthor({text: message.author.tag, icon: message.author.displayAvatarURL()});
      hallOfFameEmbed.setDescription(`[★](${message.url}) ${msgEmbed}`);
    } else {
      hallOfFameEmbed.defAuthor({text: message.author.tag, icon: message.author.displayAvatarURL()});
      hallOfFameEmbed.defDesc(`[★](${message.url}) ${message.content}`);
    }
  
    let paid = new Embed()
    .defDesc("Pagado.")
    .defColor(Colores.nocolor);
  
    switch (reaction.emoji.id) {
      case silver: // ################### PLATA ###########################
        award = "plata";
        price = 100;
        hallOfFameEmbed.defColor("#8f8f8f");
        hallOfFameEmbed.defFooter({text: `▸ Premio de plata por ${user.tag}`, timestamp: true});
        break;
  
      case gold:
        award = "oro";
        price = 500;
        gift = 100;
        hallOfFameEmbed.defColor("#FFD700");
        hallOfFameEmbed.defFooter({text: `▸ Premio de oro por ${user.tag}`, timestamp: true});
        break;
  
      case platinium:
        award = "platino";
        price = 1800;
        gift = 700;
        hallOfFameEmbed.defColor("#21ffe5");
        hallOfFameEmbed.defFooter({text: `▸ Premio de platino por ${user.tag}`, timestamp: true});
        break;
  
      default:
        isAward = false;
    }
  
    if(isAward && disableAwards === true && user.id != jeffreygID) {
      let react = message.reactions.cache.get(reaction.emoji.name + ":" + reaction.emoji.id);

      react.remove(user.id);
  
      return bots.send(`${user}, los awards actualmente están en mantenimiento, por favor intenta más tarde. :D`);
    } else if(isAward){
  
      let confirmation = new Discord.EmbedBuilder()
      .setAuthor(`Confirmación`, guild.iconURL({dynamic: true}))
      .setDescription(`**—** ${user.tag}, ¿Estás seguro de darle a este usuario el premio de **__${award}__**?
**—**( **${Emojis.Jeffros}${price.toLocaleString('es-CO')}** )

*— Para más información de las recompensas de los premios [mira esto](https://discordapp.com/channels/447797737216278528/485191307346837507/668568017042538507).*`)
      .setColor(Colores.rojo);
    
      bots.send({content: `${user}`, embeds: [confirmation]}).then(msg => {
        msg.react(":allow:558084462232076312").then(() => {
          msg.react(":denegar:558084461686947891");
        });

        let cancelEmbed = new Discord.EmbedBuilder()
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

          let user_author = await Users.findOne({ // buscar al que paga el premio
            user_id: user.id,
            guild: guild.id
          });

          let user_reciever = await Users.findOne({ // buscar el que recibe el premio
            user_id: user.id,
            guild_id: guild.id
          });

          if (!user_author || user_author.economy.global.currency < price) { // si no existe un documento con jeffros o son insuficientes
            return msg.edit({content: `No tienes **${Emojis.Jeffros}${price.toLocaleString('es-CO')}**.`, embeds: null});
          }

          if (award === "oro" || award === "platino") { // si el award es de oro o platino
            if (user_reciever === user_author) { // si es el mismo usuario
              user_reciever.economy.global.currency -= price - gift;

              msg.edit({content: null, embeds: [paid]}).then(m => {
                setTimeout(() => {
                  m.delete()
                }, ms("4s"));
              });
              return hallChannel.send({embeds: [hallOfFameEmbed]});
            }

            if (!user_reciever) {
              const newUser = new Users({
                user_id: message.author.id,
                guild: guild.id,
                economy: {
                  global: {
                    jeffros: gift
                  }
                }
              });

              user_author.economy.global.currency -= price;
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
              user_author.economy.global.currency -= price;
              user_reciever.economy.global.currency += gift;

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
            user_author.economy.global.currency -= price;

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
}