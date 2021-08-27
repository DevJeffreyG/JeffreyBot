const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const Emojis = require("./../resources/emojis.json");
const prefix = Config.prefix;
const mainChannel = Config.mainChannel;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Exp = require("../modelos/exp.js");
const Stats = require("../modelos/darkstats.js");
const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {
  if (!message.content.startsWith(prefix)) return;

  // Variables
  let author = message.author;
  const guild = message.guild;

    let errorEmbed = new Discord.MessageEmbed()
    .setTitle(`Ayuda: ${prefix}top`)
    .setColor(Colores.nocolor)
    .setDescription(`▸ El uso correcto es: ${prefix}top <jeffros || exp>`)
    .setFooter(`<> Obligatorio () Opcional`);

  let selTop = args[0] ? args[0].toLowerCase() : null;
  if (!args[0]) return message.channel.send({embeds: [errorEmbed]})

    // /top jeffros
    if (selTop === "jeffros" || selTop === "j") {

        let jeffrosq = await Jeffros.find({
          serverID: guild.id
        });

        let globalq = await GlobalData.findOne({
          "info.type": "dsInflation"
        });

        const inflation = globalq.info.inflation;

        let res = []; // array para los usuarios con jeffros & dj si es que tienen
        for (let i = 0; i < jeffrosq.length; i++) {
          const member = message.guild.members.cache.get(jeffrosq[i].userID) || null;
          
          // agregar la cantidad de darkjeffros
          if(member){

            let djeffrosq = await Stats.findOne({
              userID: jeffrosq[i].userID
            });

            let darkjeffros = djeffrosq ? Number(djeffrosq.djeffros) : 0;
            let darkjeffrosValue = djeffrosq ? Number(inflation*200*djeffrosq.djeffros) : 0;
            let finalQuantity = darkjeffrosValue != 0 ? (darkjeffrosValue) + jeffrosq[i].jeffros: jeffrosq[i].jeffros;

            let toPush = { userID: member.user.id, darkjeffros: darkjeffros, darkjeffrosValue: darkjeffrosValue, total: finalQuantity }

            res.push(toPush)
          }
        }

        res.sort(function(a, b){ // ordenar el array mayor a menor, por array.total
          if(a.total > b.total){
            return -1;
          }
          if(a.total < b.total){
            return 1;
          }

          return 0;
        })

        // creación del embed
        let jeffrosEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Top del total de Jeffros`, guild.iconURL())
        .setTimestamp();

        // OBTENER LA POSICION DEL QUE USA EL COMANDO

        let n = 0;
        let yourRank;
        for (var i = 0; i < res.length; i++) {
          let noMore = false;

          let member = message.guild.members.cache.get(res[n].userID) || null;
          if (!member) {
            n++;

            noMore = true;
          }

          if (res[n].userID === author.id) {
            let number = i + 1;

            switch (number) {
              case 1:
                yourRank = `🏆${number}ro`;
                break;

              case 2:
                yourRank = `🥈${number}do`;
                break;

              case 3:
                yourRank = `🥉${number}ro`;
                break;

              case 4:
              case 5:
              case 6:
                yourRank = `${number}to`;
                break;

              case 7:
              case 10:
                yourRank = `${number}mo`;
                break;

              case 9:
                yourRank = `${number}no`;
                break;

              default:
                yourRank = `${number}vo`;
                break;
            }

            jeffrosEmbed.setFooter(`Eres el ${yourRank} en el top`);
            i = res.length;
          }

          if (noMore === false) n++;
        }

        // agregarlos al embed

        // Si no hay resultados
        if (res.length === 0) {
          jeffrosEmbed.setColor(Colores.rojo);
          jeffrosEmbed.setDescription(`No se han encontrado ${Emojis.Jeffros}effros. Escribe en <#${mainChannel}> para ganarlos.`);
        } else if (res.length < 5) {
          // Menos de 5 resultados
          jeffrosEmbed.setColor(Colores.verde);
          
          let n;
          let isIgnored = false;
          for (i = 0; i < res.length; i++) {
            let noMore = false;
            if (!n) {
              n = 0;
            }

            let member = message.guild.members.cache.get(res[n].userID) || null;
            if (!member) {
              n++;
              i--;

              isIgnored = true;
              noMore = true;

              /*jTop.addField(
                `${i + 1}. ${member}`,
                `**—** ${Emojis.Jeffros}${res[i].jeffros}`
              );*/
            } else {
              let darkshopMoney = res[n].darkjeffros != 0 ? ` (${Emojis.Dark}${res[n].darkjeffros}➟**${Emojis.Jeffros}${res[n].darkjeffrosValue}**)` : "";
              if (n + 1 === 1) {
                jeffrosEmbed.addField(`🏆 ${member.user.username}`, `**—** ${Emojis.Jeffros}${res[n].total}${darkshopMoney}`);
              } else if (n + 1 === 2) {
                jeffrosEmbed.addField(`🥈 ${member.user.username}`, `**—** ${Emojis.Jeffros}${res[n].total}${darkshopMoney}`);
              } else if (n + 1 === 3) {
                jeffrosEmbed.addField(`🥉 ${member.user.username}`, `**—** ${Emojis.Jeffros}${res[n].total}${darkshopMoney}`);
              } else {
                jeffrosEmbed.addField(`${i + 1}. ${member.user.username}`, `**—** ${Emojis.Jeffros}${res[n].total}${darkshopMoney}`);
              }
            }

            if (noMore == false) n++;
          }
        } else {
          // Más de 5 resultados
          jTop.setColor(Colores.verde);
          let n;
          let isIgnored = false;
          for (i = 0; i < 5; i++) {
            let noMore = false;
            if (!n) {
              n = 0;
            }

            let member = message.guild.members.cache.get(res[n].userID) || null;
            if (!member) {
              n++;
              i--;

              isIgnored = true;
              noMore = true;

              /*jTop.addField(
                `${i + 1}. ${member}`,
                `**—** ${Emojis.Jeffros}${res[i].jeffros}`
              );*/
            } else {
              let darkshopMoney = res[n].darkjeffros != 0 ? ` (${Emojis.Dark}${res[n].darkjeffros}➟**${Emojis.Jeffros}${res[n].darkjeffrosValue}**)` : "";
              if (n + 1 === 1) {
                jeffrosEmbed.addField(`🏆 ${member.user.username}`, `**—** ${Emojis.Jeffros}${res[n].total}${darkshopMoney}`);
              } else if (n + 1 === 2) {
                jeffrosEmbed.addField(`🥈 ${member.user.username}`, `**—** ${Emojis.Jeffros}${res[n].total}${darkshopMoney}`);
              } else if (n + 1 === 3) {
                jeffrosEmbed.addField(`🥉 ${member.user.username}`, `**—** ${Emojis.Jeffros}${res[n].total}${darkshopMoney}`);
              } else {
                jeffrosEmbed.addField(`${i + 1}. ${member.user.username}`, `**—** ${Emojis.Jeffros}${res[n].total}${darkshopMoney}`);
              }
            }

            if (noMore == false) n++;
          }
        }

        return message.channel.send({embeds: [jeffrosEmbed]});
    } else

    // top exp
    if (selTop === "exp" || selTop === "e" || selTop === "ex") {
      Exp.find({
        serverID: guild.id
      })
        .sort([["exp", "descending"]])
        .exec((err, res) => {
          if (err) throw err;

          let exTop = new Discord.MessageEmbed()
          .setAuthor(`| Top de EXP`, guild.iconURL())
          .setTimestamp();

          // OBTENER LA POSICION DEL QUE USA EL COMANDO

          let n;
          let isIgnored = false;
          for (var i = 0; i < res.length; i++) {
            let noMore = false;
            if (!n) {
              n = 0;
            }

            let member =
              message.guild.members.cache.get(res[n].userID) ||
              "(Dejó el servidor)";
            if (member === "(Dejó el servidor)") {
              n++;  

              noMore = true;
            }

            if (res[n].userID === author.id) {
              let number = i + 1;
              let yourRank;

              switch (number) {
                case 1:
                  yourRank = `🏆${number}ro`;
                  break;

                case 2:
                  yourRank = `🥈${number}do`;
                  break;

                case 3:
                  yourRank = `🥉${number}ro`;
                  break;

                case 4:
                case 5:
                case 6:
                  yourRank = `${number}to`;
                  break;

                case 7:
                case 10:
                  yourRank = `${number}mo`;
                  break;

                case 9:
                  yourRank = `${number}no`;
                  break;

                default:
                  yourRank = `${number}vo`;
                  break;
              }

              exTop.setFooter(`Eres el ${yourRank} en el top`);
              i = res.length;
            }

            if (noMore === false) n++;
          }

          // Si no hay resultados
          if (res.length === 0) {
            exTop.setColor(Colores.rojo);
            exTop.setDescription(
              `No se ha encontrado EXP. Escribe en <#${mainChannel}> para ganarla.`
            );
          } else if (res.length < 5) {
            // Menos de 5 resultados
            exTop.setColor(Colores.verde);
            let n;
            let isIgnored = false;
            for (var i = 0; i < res.length; i++) {
              let noMore = false;
              if (!n) {
                n = 0;
              }

              exTop.setColor(Colores.verde);
              let member =
                message.guild.members.cache.get(res[n].userID) ||
                res[n].username + "(Dejó el servidor)";
              if (member === res[n].username + "(Dejó el servidor)") {
                n++;
                i--;

                isIgnored = true;
                noMore = true;
                /*exTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** Nivel: \`${res[i].level}\`\n**—** EXP: \`${res[i].exp}\``
                );*/
              } else {
                if (n + 1 === 1) {
                  exTop.addField(
                    `🏆 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else if (n + 1 === 2) {
                  exTop.addField(
                    `🥈 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else if (n + 1 === 3) {
                  exTop.addField(
                    `🥉 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else {
                  exTop.addField(
                    `${i + 1}. ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                }
              }
              if (noMore === false) n++;
            }
          } else {
            // Más de 5 resultados
            exTop.setColor(Colores.verde);
            let n;
            let isIgnored = false;
            for (var i = 0; i < 5; i++) {
              let noMore = false;
              if (!n) {
                n = 0;
              }

              exTop.setColor(Colores.verde);
              let member =
                message.guild.members.cache.get(res[n].userID) ||
                res[n].username + "(Dejó el servidor)";
              if (member === res[n].username + "(Dejó el servidor)") {
                n++;
                i--;

                isIgnored = true;
                noMore = true;
                /*exTop.addField(
                  `${i + 1}. ${member}`,
                  `**—** Nivel: \`${res[i].level}\`\n**—** EXP: \`${res[i].exp}\``
                );*/
              } else {
                if (n + 1 === 1) {
                  exTop.addField(
                    `🏆 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else if (n + 1 === 2) {
                  exTop.addField(
                    `🥈 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else if (n + 1 === 3) {
                  exTop.addField(
                    `🥉 ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                } else {
                  exTop.addField(
                    `${i + 1}. ${member.user.username}`,
                    `**—** Nivel: \`${res[n].level}\`\n**—** EXP: \`${res[n].exp}\``
                  );
                }
              }
              if (noMore === false) n++;
            }
          }

          return message.channel.send({embeds: [exTop]});
        });
    }
};

module.exports.help = {
  name: "top"
};
