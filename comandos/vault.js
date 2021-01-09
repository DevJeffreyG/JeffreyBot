const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const ms = require("ms");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Vault = require("../modelos/vault.js");
const WinVault = require("../modelos/winVault.js");
const Hint = require("../modelos/hint.js");
const Jeffros = require("../modelos/jeffros.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  message.delete({ timeout: ms("5s") });

  // Variables
  let author = message.author;
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(bot.user.id === Config.testingJBID){
    return message.channel.send("Este comando es de uso exclusivo del server por las diferentes variables que se encuentran en código.")
  }

  let embed = new Discord.MessageEmbed()
    .setTitle(`Ayuda: ${prefix}vault`)
    .setColor(Colores.nocolor)
    .setDescription(
      `▸ Se te dirá una adivinanza aleatoria, deberás adivinarla para recibir la esperada recompensa, te conviene mantener oculta la contraseña.\n▸ \`${prefix}vault <me || @usuario>\` para saber cuántos códigos ha descifrado.`
    );

  if (args[0]) {
    var action = args[0].toLowerCase();
  }

  if (!message.member.roles.cache.find(x => x.id === Config.lvl1)) {
    let r = guild.roles.cache.find(x => x.id === Config.lvl1);

    let rsNoAccess = [
      "No puedes.",
      "No cumples mis requisitos.",
      "Te falta algo...",
      "No podrás pasar sin él.",
      "Vuelve cuando tengas lo necesario.",
      "¿Sigues intentándolo?"
    ];

    let noAccess = rsNoAccess[Math.floor(Math.random() * rsNoAccess.length)];

    let e = new Discord.MessageEmbed()
      .setDescription(noAccess)
      .setColor(Colores.rojo)
      .setFooter(`Te falta ${r.name} para poder usar este comando.`);

    return message.channel.send(e);
  }

  let userMention = message.guild.member(
    message.mentions.users.first() || message.guild.members.cache.get(args[0])
  );

  if (action === "help" || action === "ayuda") {
    return message.channel.send(embed);
  } else if (userMention || action === "me" || action === "yo") {
    if (action === "me" || action === "yo") {
      userMention = message.guild.member(author.id);
    }

    WinVault.find(
      {
        userID: userMention.id
      },
      (err, user) => {
        if (err) throw err;

        if (!user || user.length === 0) {
          return message.reply(
            `esta persona no ha sido encontrada en los que irrumpieron en mi propiedad.`
          );
        } else {
          Vault.countDocuments({}, (err, c) => {
            if (err) throw err;

            let e = new Discord.MessageEmbed()
              .setAuthor(
                `| ${userMention.user.tag}`,
                userMention.user.displayAvatarURL()
              )
              .setDescription(`▸ \`${user.length}\` / \`${c}\` descifrados.`)
              .setColor(Colores.verde);

            return message.channel.send(e);
          });
        }
      }
    );
  } else if (action === "add") {
    if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;
    if (!args[1] || !args[2])
      return message.reply(
        `¿pista \`hint [idCode] [Pista]\`? o ¿código final \`code [Recompensa] [Final]\`?`
      );

    let toAdd = args[1].toLowerCase();

    if (toAdd === "hint") {
      // primero se cuentan cuantos documentos // pistas hay

      Hint.countDocuments({}, (err, c) => {
        if (err) throw err;

        if (!args[3]) return message.reply("vault add hint [idCode] [Pista]");

        let idCode = args[2];
        let strHint = args.join(" ").slice(10 + args[2].length);

        Hint.find(
          {
            codeID: idCode
          },
          (err, findHint) => {
            if (err) throw err;

            if (!findHint) {
              const newHint = new Hint({
                codeID: idCode,
                hint: strHint,
                num: 1,
                id: c + 1
              });

              newHint.save();

              let e = new Discord.MessageEmbed()
                .setAuthor(`| Nueva pista`, Config.bienPng)
                .setDescription(
                  `**—** ID de Código ganador: \`${idCode}\`
**—** Pista: \`${strHint}\`
**—** Orden de la pista: \`${newHint.num}\`
**—** ID de pista: \`${newHint.id}\``
                )
                .setColor(Colores.verde);

              message.channel.send(e);
            } else {
              const newHint = new Hint({
                codeID: idCode,
                hint: strHint,
                num: findHint.length + 1,
                id: c + 1
              });

              newHint.save();

              let e = new Discord.MessageEmbed()
                .setAuthor(`| Nueva pista`, Config.bienPng)
                .setDescription(
                  `**—** ID de Código ganador: \`${idCode}\`
**—** Pista: \`${strHint}\`
**—** Orden de la pista: \`${newHint.num}\`
**—** ID de pista: \`${newHint.id}\``
                )
                .setColor(Colores.verde);

              message.channel.send(e);
            }
          }
        );
      });
    } else if (toAdd === "code") {
      Vault.countDocuments({}, (err, c) => {
        if (err) throw err;

        // /vault add code $ ""

        let award = args[2].toUpperCase();

        if (isNaN(award))
          return message.reply(
            `¿Recompensa?\n> ${prefix}vault add code {JEFFROS} {CODE}`
          );
        let strCode = args.join(" ").slice(10 + args[2].length);

        Vault.findOne(
          {
            code: strCode
          },
          (err, vault) => {
            if (err) throw err;

            if (!vault) {
              const newCode = new Vault({
                reward: award,
                code: strCode.toUpperCase(),
                id: c + 1
              });

              newCode.save();

              let e = new Discord.MessageEmbed()
                .setAuthor(`| Nuevos textos`, Config.bienPng)
                .setDescription(
                  `**—** Código: \`${strCode}\`
**—** Recompensa: **${Emojis.Jeffros}${award}**
**—** __ID de Código__: \`${newCode.id}\``
                )
                .setColor(Colores.verde);

              message.channel.send(e);
            } else {
              return message.reply(`esos textos ya existen aquí en la bóveda.`);
            }
          }
        );
      });
    }
  } else if (args[0]) {
    Vault.findOne(
      {
        code: args[0].toUpperCase()
      },
      (err, textos) => {
        if (err) throw err;

        let nope = [
          "Nope",
          "¿No tienes otra cosa que hacer?",
          "Ve a jugar un poco",
          "Stop",
          "¿{{ CODE }}? Ehhh, no.",
          "¡Las puertas se abrieron! Ahora sal de la bóveda.",
          "¿Por qué no mejor usas `/coins`?",
          "No sirve",
          "¿Estás determinado?",
          "No es tan díficil. ¿O sí?",
          "Sólo es una palabra vamos.",
          "¿Realmente necesitas el dinero?",
          "¿Ya estás suscrito a Jeffrey?",
          "Como que, tu código caducó o algo así...",
          "heh",
          "Pues no funcionó",
          "Deja de intentarlo"
        ];

        let response = nope[Math.floor(Math.random() * nope.length)];
        let efinal = response.replace(
          new RegExp("{{ CODE }}", "g"),
          `${args[0]}`
        );

        if (!textos) {
          return message.channel
            .send(efinal)
            .then(m => m.delete({ timeout: ms("5s") }));
        }

        WinVault.findOne(
          {
            codeID: textos.id,
            userID: author.id
          },
          (err, win) => {
            if (err) throw err;

            if (win) {
              return message.channel
                .send(efinal)
                .then(m => m.delete({ timeout: ms("5s") }));
            } else {
              Jeffros.findOne(
                {
                  userID: author.id
                },
                (err, jeffros) => {
                  jeffros.jeffros += textos.reward;

                  jeffros.save();

                  message.delete();

                  let gg = [
                    "Toma tus { JEFFROS } y vete de mi bóveda.",
                    "¿{ JEFFROS }? Felicidades, ahora deja de intentar.",
                    "{ JEFFROS }. ¿Ya puedes dejarme solo?",
                    "¿QUÉ? ¿DÓNDE ESTÁN MIS { JEFFROS }?",
                    "Tuviste suerte, pero la próxima no será tan fácil conseguir { JEFFROS }."
                  ];

                  let ggs = gg[Math.floor(Math.random() * gg.length)];
                  let finale = ggs.replace(
                    new RegExp("{ JEFFROS }", "g"),
                    `**${Emojis.Jeffros}${textos.reward}**`
                  );

                  let ggEmbed = new Discord.MessageEmbed()
                    .setAuthor(`| Desencriptado.`, Config.bienPng)
                    .setColor(Colores.verde)
                    .setDescription(finale);

                  const newWin = new WinVault({
                    codeID: textos.id,
                    userID: author.id
                  });

                  newWin.save();

                  return message.channel.send(ggEmbed);
                }
              );
            }
          }
        );
      }
    );
  } else {
    // buscando tesoros

    // HORA DE MOVER PROBABILIDADES
    WinVault.find(
      {
        userID: author.id
      },
      (err, wins) => {
        Vault.countDocuments({}, (err, vaults) => {
          let randomHint = Math.floor(Math.random() * vaults)
          if (wins.length === vaults - 1) {
            for (let i = 1; i <= vaults; i++) {
              WinVault.findOne(
                {
                  userID: author.id,
                  codeID: i
                },
                (err, won) => {
                  if (!won) {
                    vaultMode(i);
                  } else if (i === vaults) {
                    vaultMode(randomHint);
                  }
                }
              );
            }
          } else if(wins.length === vaults){ // si los tiene todos
            vaultMode(1);
          } else {
            vaultMode(randomHint);
          }
        });
      }
    );

    function vaultMode(hint) {
      Vault.find({}, function(err, pistas) {
        if (pistas.length === 0) {
          return message.reply(`No deberías estar aquí.`);
        }

        Vault.findOne(
          {
            id: hint
          },
          (err, pista1) => {
            if (err) throw err;
            Hint.countDocuments(
              {
                codeID: pista1.id
              },
              (err, totalhints) => {
                Hint.find({
                  codeID: pista1.id
                })
                  .sort([["num", "ascending"]])
                  .exec((err, pista) => {
                    // captcha si el código ya se descifró.

                    WinVault.findOne(
                      {
                        codeID: pista[0].codeID,
                        userID: author.id
                      },
                      (err, won) => {
                        //console.log(`${pista1.code}: ${pista1.id} || ${pista[0].hint}`);
                        if (!won) {
                          let pistan = 1;

                          const embed = new Discord.MessageEmbed()
                            .setColor(Colores.verde)
                            .setFooter(
                              `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
                            )
                            .setDescription(pista[pistan - 1].hint);

                          message.channel.send(embed).then(msg => {
                            msg.react("⏪").then(r => {
                              msg.react("⏩");

                              const backwardsFilter = (reaction, user) => reaction.emoji.name === "⏪" && user.id === message.author.id;
                              const forwardsFilter = (reaction, user) => reaction.emoji.name === "⏩" && user.id === message.author.id;
                              const collectorFilter = (reaction, user) => reaction.emoji.name === "⏪" || reaction.emoji.name === "⏩" && user.id === message.author.id;

                              const backwards = msg.createReactionCollector(backwardsFilter, { time: 60000 });
                              const forwards = msg.createReactionCollector(forwardsFilter, { time: 60000 });
                              const collector = msg.createReactionCollector(collectorFilter, { time: 60000 });

                              collector.on("end", r => {
                                if(r.total === 0) return;
                                return msg.reactions.removeAll()
                                .then(() => {
                                  msg.react("795090708478033950");
                                });
                              });

                              backwards.on("collect", r => {
                                if (pistan === 1) return;
                                pistan--;
                                embed.setFooter(
                                  `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
                                );
                                embed.setDescription(pista[pistan - 1].hint);
                                msg.edit(embed);
                              });

                              forwards.on("collect", r => {
                                if (pistan === pista.length) return;
                                pistan++;
                                embed.setFooter(
                                  `Pista ${pistan} de ${totalhints} | /vault [codigo] para decifrar.`
                                );
                                embed.setDescription(pista[pistan - 1].hint);

                                msg.edit(embed);
                              });
                            });
                          });
                        } else {
                          let respRelleno = [
                            "Jeffrey sube vídeo",
                            "No seas malo",
                            "Las rosas son rojas",
                            "Los caballos comen manzanas",
                            "siganme en twitter xfa @pewdiepie",
                            "No tengo plata. ¿me donan?",
                            "Mindblowing"
                          ];

                          let relleno =
                            respRelleno[
                              Math.floor(Math.random() * respRelleno.length)
                            ];

                          let r = new Discord.MessageEmbed()
                            .setDescription(relleno)
                            .setColor(Colores.blanco);

                          return message.channel
                            .send(r)
                            .then(m => m.delete({ timeout: ms("5s") }));
                        }
                      }
                    );
                  });
              }
            );
          }
        );
      });
    }
  }
};

module.exports.help = {
  name: "vault"
};
