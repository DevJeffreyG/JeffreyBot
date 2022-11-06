const { PermissionsBitField, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, EmbedBuilder, Guild, GuildMember, CommandInteraction, BaseInteraction } = require("discord.js");
const { ButtonStyle, OverwriteType } = require("discord-api-types/v10");

const Config = require("../resources/base.json");
const Colores = require("../resources/colores.json");
const Cumplidos = require("../resources/cumplidos.json");

const ErrorEmbed = require("../utils/ErrorEmbed");
const Embed = require("../utils/Embed");
const InteractivePages = require("../utils/InteractivePages");

const ms = require("ms");

const moment = require('moment');

/* ##### MONGOOSE ######## */

const { Users, Exps, Guilds, DarkShops, Shops, Warns, DarkItems, GlobalDatas, TotalPurchases } = require("mongoose").models;

// JEFFREY BOT NOTIFICATIONS
const { google } = require("googleapis");
const Twitter = require("twitter");
const { ApiClient } = require("@twurple/api");
const { ClientCredentialsAuthProvider } = require("@twurple/auth");
const { BoostObjetives, EndReasons } = require("./Enums");

/* ##### MONGOOSE ######## */
const RandomCumplido = function (force = null) {
  return force ? Cumplidos.c[force] : Cumplidos.c[Math.floor(Math.random() * Cumplidos.c.length)];
}
const findLvls5 = async function (client, guild) {
  let role = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "791006500973576262") : guild.roles.cache.find(x => x.id === Config.dsRole);
  Exps.find({
    serverID: guild.id
  }, async (err, exps) => {
    if (err) throw err;

    if (!exps) return;

    for (let i = 0; i < exps.length; i++) {
      let exp = exps[i];
      let member = guild.members.cache.find(x => x.id === exp.userID);

      if (exp.level >= 5) {
        if (member && !member.roles.cache.find(x => x.id === role.id)) await member.roles.add(role);
      }
    }
  })
}

const GetChangesAndCreateFields = async function (logsFetched) {


  let fields = [];
  let separator = "**—**";

  logsFetched.forEach(log => {
    console.log("🟩 Fields actuales:", fields)

    const { client } = log;
    const { Emojis } = client;

    let changesArray = log.changes;

    console.log("♾️ Array de cambios", changesArray)

    let target = log.target;
    let extra = log.extra;
    let extraType = extra ? extra.user ? OverwriteType.Member : OverwriteType.Role : null;

    let resetedPerms = resetWork(log)

    changesLoop:
    for (let i = 0; i < changesArray.length; i++) {
      const change = changesArray[i];

      let cambio;
      let ahora = change.new;
      let antes = change.old;
      let nuevosPermisos, viejosPermisos, diff;

      switch (change.key) {
        case "topic":
          cambio = "Nuevo tema";
          break;

        case "name":
          cambio = "Nuevo nombre";
          break;

        case "deny": {
          nuevosPermisos = new PermissionsBitField(change.new);
          viejosPermisos = new PermissionsBitField(change.old);

          let permissionOverwrite = target.permissionOverwrites.cache.find(x => x.deny.bitfield === nuevosPermisos.bitfield && x.type === extraType && x.id === extra.id);
          if (!permissionOverwrite) return;
          let changed = permissionOverwrite.type === OverwriteType.Role ? permissionOverwrite.channel.guild.roles.cache.find(x => x.id === permissionOverwrite.id) : permissionOverwrite.channel.guild.members.cache.find(x => x.id === permissionOverwrite.id);

          cambio = `${permissionOverwrite.type === OverwriteType.Role ? "Role" : "Usuario"} ${permissionOverwrite.type === OverwriteType.Role ? changed.name : changed.displayName}`;

          ahora = "";

          diff = viejosPermisos.missing(nuevosPermisos)

          diff.forEach(permiso => {
            ahora += `${Emojis.Deny} ${permiso}\n`;
          });

          // se está reseteando?
          const isReseted = resetedPerms.toArray().length != 0
          if (isReseted) {
            antes = "";
            resetedPerms.toArray().forEach(permiso => {
              antes += `${Emojis.Neutral} ${permiso}\n`;
            });

            fields.push({
              name: `${separator} ` + cambio,
              value: `**Reseteados**\n${antes}`
            });

            resetedPerms = new PermissionsBitField(); // quitar los permisos guardados para evitar que se repitan
          }

          if (ahora.length != 0) fields.push({
            name: `${separator} ` + cambio,
            value: `**Denegados**\n${ahora}`
          });
          continue changesLoop;
        }

        case "allow": {
          nuevosPermisos = new PermissionsBitField(change.new);
          viejosPermisos = new PermissionsBitField(change.old);

          let permissionOverwrite = target.permissionOverwrites.cache.find(x => x.allow.bitfield === nuevosPermisos.bitfield && x.type === extraType && x.id === extra.id);
          if (!permissionOverwrite) return;
          let changed = permissionOverwrite.type === OverwriteType.Role ? permissionOverwrite.channel.guild.roles.cache.find(x => x.id === permissionOverwrite.id) : permissionOverwrite.channel.guild.members.cache.find(x => x.id === permissionOverwrite.id);

          cambio = `${permissionOverwrite.type === OverwriteType.Role ? "Role" : "Usuario"} ${permissionOverwrite.type === OverwriteType.Role ? changed.name : changed.displayName}`;

          ahora = "";

          diff = viejosPermisos.missing(nuevosPermisos)

          diff.forEach(permiso => {
            ahora += `${Emojis.Allow} ${permiso}\n`;
          });

          // se está reseteando?
          const isReseted = resetedPerms.toArray().length != 0
          if (isReseted) {
            /* if(resetQuery.find(x => x.key === "deny" && new PermissionsBitField(x.new).has(viejosPermisos))) continue changesLoop;
             */
            antes = "";
            resetedPerms.toArray().forEach(permiso => {
              antes += `${Emojis.Neutral} ${permiso}\n`;
            });

            fields.push({
              name: `${separator} ` + cambio,
              value: `**Reseteados**\n${antes}`
            });

            resetedPerms = new PermissionsBitField(); // quitar los permisos guardados para evitar que se repitan
          }

          if (ahora.length != 0) fields.push({
            name: `${separator} ` + cambio,
            value: `**Permitidos**\n${ahora}`
          });
          continue changesLoop;
        }

        case "id":
          cambio = "Con ID"
          break;

        case "type":
          continue changesLoop;

        default:
          cambio = "Cambios";
      }

      if (!ahora) return;

      ahora = isNaN(ahora) ? `\n**Ahora**\n${ahora}` : null;
      antes = antes != undefined ? `\n\n**Antes**\n${antes}` : null;

      if (ahora && antes) fields.push({
        name: `${separator} ` + cambio,
        value: `${ahora}${antes}`
      });
    }
  })

  //console.log("FIELDS BASE", fields);

  let repeatedQuery = new Map();

  fields.forEach((field, index) => {
    let getInMap = repeatedQuery.get(field.name); // index
    if (isNaN(getInMap)) return repeatedQuery.set(field.name, index);

    fields[getInMap].value += `${field.value}`;
    fields.splice(index, 1);
  })

  //console.log("FIELDS ACTUALIZADOS", fields);
  console.log("----------------")


  if (fields.length > 0) return fields;
  else return null;
}

let resetWork = (log) => {
  console.log("⚪ Inicializando trabajo de detectar permisos reseteados");

  const cambios = log.changes;
  let reseted = new PermissionsBitField();


  cambios.forEach(change => {
    if (change.key != "allow" && change.key != "deny") return console.log("⚪ KEY '%s' INVÁLIDA, ABORTANDO.", change.key)
    console.log(`⚪ ================= 🕰️ CHANGE INFO 🕰️ =================\n⚪ Change key: ${change.key}\n⚪ Nuevo: ${change.new}\n⚪ Viejo: ${change.old}\n⚪ =================`)
    console.log("⚪ " + change)
    change.old ?? 0;
    change.new ?? 0;

    const oldperms = new PermissionsBitField(change.old);
    const newperms = new PermissionsBitField(change.new);

    const permsChanged = newperms.missing(oldperms);
    const rolePerms = log.target.permissionOverwrites.resolve(log.extra.id);

    console.log("⚪ Permisos que cambiaron:", permsChanged);
    if (permsChanged.length === 0) {
      console.log("🟥 No pasó a neutral."); // pasa de neutral a algo más
    } else

      permsChanged.forEach(permiso => {
        const discordPermiso = new PermissionsBitField(permiso);
        if (change.key === "deny") { // el permiso pasó hacia la derecha, o reset o allow
          const isAllowed = rolePerms.allow.has(discordPermiso);

          if (isAllowed) return console.log("🟥 No pasó a neutral.");
          else reseted.add(discordPermiso);
        } else {
          const isDenied = rolePerms.deny.has(discordPermiso);

          if (isDenied) console.log("🟥 No pasó a neutral.");
          else reseted.add(discordPermiso);
        }
      })
  });
  console.log("⚪ =====================================================================================")
  console.log(`🟢 PERMISOS RESETEADOS:`, reseted, "Es decir ➡️", reseted.toArray());
  return reseted;
}

const FetchAuditLogs = async function (client, guild, types) {
  return new Promise(async (resolve, reject) => {
    let toReturn = [];

    for (let i = 0; i < types.length; i++) {
      const type = types[i];

      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type });

      const fetched = fetchedLogs.entries.first();

      if (fetched === undefined) {
        console.error("⚠️ No se encontró ningún log con el tipo", type);
        break;
      }

      if (moment(fetched.createdAt).isBefore(moment().subtract(1, "minute"))) {
        //console.error("⚠️ Log hace más de un minuto", fetched);
        break;
      }

      // revisar si ya se habia enviado al log
      if (client.logsFetched[fetched.id]) continue;

      client.logsFetched[fetched.id] = true;

      if (!fetched) return;
      const { executor, target, changes, extra } = fetched;

      toReturn.push({
        client,
        changes,
        executor,
        target,
        extra
      })
    }

    resolve(toReturn);
  })
}


/**
 * 
 * @param {*} guild The Discord.JS guild where this comes from
 * @param {String} header The text that appears at the title of the embed
 * @param {String} footer The text that appears at the footer of the embed
 * @param {Array} description The items that are separated by "—"
 * @param {String} headerPng The image (url) that appears at the left of the title
 * @param {String} footerPng The image (url) that appears at the left of the footer
 * @param {String} color The HEX color of the embed
 * @param {String} [logType="GENERAL"] The type of the log
 * - GENERAL
 * - MODERATION
 * - STAFF
 * @returns {Promise} The Discord.JS Message sent
 */
const GenerateLog = async function (guild, header, footer, description, headerPng, footerPng, color, logType, fields) {
  logType = logType ?? "GENERAL";
  fields = fields ?? null;

  const embed = new Embed()
    .defAuthor({ text: header, icon: headerPng ?? null })
    .defFooter({ text: footer, icon: footerPng ?? null, timestamp: true })
    .defColor(color);

  let desc = "";

  for (let i = 0; i < description.length; i++) {
    const item = description[i];

    desc += "**—** " + item + "\n";
  }

  embed.defDesc(desc);

  if (fields) {
    fields.forEach(field => {
      embed.defField(field.name, field.value);
    })
  }

  let docGuild = await Guilds.findOne({ guild_id: guild.id }) ?? null;

  if (!docGuild) return console.error("No se ha configurado un logchannel en el servidor", guild.name);

  let channel;

  switch (logType.toUpperCase()) {
    case "GENERAL":
      if (!docGuild.channels.general_logs) return;
      channel = guild.channels.cache.find(x => x.id === docGuild.channels.general_logs);
      break;

    case "MODERATION":
      if (!docGuild.channels.moderation_logs) return;
      channel = guild.channels.cache.find(x => x.id === docGuild.channels.moderation_logs);
      break;

    case "STAFF":
      if (!docGuild.channels.staff_logs) return;
      channel = guild.channels.cache.find(x => x.id === docGuild.channels.staff_logs);
      break;
  }

  if (!channel) return console.error("No se ha configurado un logchannel en el servidor", guild.name, logType.toUpperCase());

  return sendLog(channel, embed);
}

/**
 * 
 * @param {boolean} [justTempRoles=false] Just execute interval of temporal roles
 * @returns void
 */
const intervalGlobalDatas = async function (client, justTempRoles) {
  justTempRoles = justTempRoles || false;
  const { Emojis } = client;

  let guild;
  let bdRole;
  let logs;
  let dsChannel = client.channels.cache.find(x => x.id === Config.dsChannel);
  let dsNews;

  if (client.user.id === Config.testingJBID) {
    guild = client.guilds.cache.find(x => x.id === "482989052136652800");
    bdRole = guild.roles.cache.find(x => x.id === "544687105977090061");
    logs = guild.channels.cache.find(x => x.id === "483108734604804107");
    dsNews = guild.roles.cache.find(x => x.id === "790431614378704906");
    dsChannel = client.channels.cache.find(x => x.id === "790431676970041356");
  } else {
    guild = client.guilds.cache.find(x => x.id === Config.jgServer);
    bdRole = guild.roles.cache.find(x => x.id === Config.bdRole);
    logs = guild.channels.cache.find(x => x.id === Config.logChannel);
    dsNews = guild.roles.cache.find(x => x.id === Config.dsnews);
  }

  await guild.members.fetch();
  let members = guild.members.cache;
  // buscar roles temporales & cumpleaños
  members.forEach(async (member) => {
    let dbUser = await Users.getOrCreate({
      user_id: member.id,
      guild_id: guild.id
    });

    if(!dbUser) return

    let roles = dbUser.data.temp_roles;
    let birthday = dbUser.data.birthday.locked;
    let temproledeletions = await GlobalDatas.getTempRoleDeletions(member.id);

    if (roles) {
      for (let i = 0; i < dbUser.data.temp_roles.length; i++) {
        const temprole = dbUser.data.temp_roles[i];
        let role = guild.roles.cache.find(x => x.id === temprole.role_id);
        let since = temprole.active_since;
        let realDuration = temprole.duration;
        let today = new Date();

        if (today - since >= realDuration) {

          if (!temprole.isSub) {
            // sacarle el role
            console.log("🟢 Ha pasado el tiempo del temprole %s", temprole);
            member.roles.remove(role);

            // eliminar el temprole de la db
            dbUser.data.temp_roles.splice(i, 1);
            dbUser.save();
          } else { // es una suscripción
            let price = Number(temprole.sub_info.price);
            let subName = temprole.sub_info.name;
            let isCancelled = temprole.sub_info.isCancelled;

            let notEnough = new ErrorEmbed(interaction)
              .defDesc(`**—** No tienes suficientes Jeffros **(${Emojis.Jeffros}${price.toLocaleString('es-CO')})** para pagar la suscripción a \`${subName}\`.
**—** Tu saldo ha quedado en **alerta roja**.`);

            if (isCancelled) {
              member.roles.remove(role);

              // eliminar el temprole de la db
              dbUser.data.temp_roles.splice(i, 1);
              dbUser.save();
            } else {
              // cobrar jeffros
              let jeffros = dbUser.economy.global;

              let paidEmbed = new Embed({
                type: "success",
                data: {
                  title: "Pagado",
                  desc: [
                    `Se han restado **${Emojis.Jeffros}${price.toLocaleString('es-CO')}** para pagar la suscripción a \`${subName}\`.`,
                    `Tu saldo ha quedado en **${Emojis.Jeffros}${(jeffros.jeffros - price).toLocaleString('es-CO')}**.`
                  ]
                }
              })

              if (!jeffros || jeffros.jeffros < price) {
                // quitarle los jeffros, y dejarlo en negativo
                console.log(jeffros.userID, "ha quedado en negativos por no poder pagar", subName);
                jeffros.jeffros -= price;
                member.send({ embeds: [notEnough] });

                // eliminar el temprole de la db
                dbUser.data.temp_roles.splice(i, 1);

                member.roles.remove(role);
                dbUser.save();
              } else { // cobrar
                jeffros.jeffros -= price;
                dbUser.save();

                // actualizar el globaldata
                temprole.active_since = today;
                dbUser.save();

                member.send({ embeds: [paidEmbed] });
              }
            }
          }
        }
      }
    }

    if (birthday) {
      let bdDay = dbUser.data.birthday.day;
      let bdMonth = dbUser.data.birthday.month;

      let now = new Date();
      let actualDay = now.getDate();
      let actualMonth = now.getMonth();

      if ((actualDay == bdDay) && (actualMonth + 1 == bdMonth)) { // actualMonth + 1 ( 0 = ENERO && 11 = DICIEMBRE )
        // ES EL CUMPLEAÑOS
        if (!member.roles.cache.find(x => x.id === bdRole.id)) member.roles.add(bdRole);
      } else {
        // revisar si tiene el rol de cumpleaños, entonces quitarselo
        if (member.roles.cache.find(x => x.id === bdRole.id)) member.roles.remove(bdRole);
      }
    }

    if (temproledeletions) { // hay roles eliminados de manera temporal
      for (const deletion of temproledeletions) {
        if (moment().isAfter(deletion.until)) {
          member.roles.add(deletion.role_id)
          deletion.remove();
        }
      }
    }
  })

  if (justTempRoles === true) return;

  // ###### DARKSHOP ######
  await DarkShopWork(client, guild.id);

  // buscar temp bans
  GlobalDatas.find({
    "info.type": "temporalGuildBan",
    "info.guild_id": guild.id
  }, (err, tempBans) => {
    if (err) throw err;

    if (tempBans) {
      for (let i = 0; i < tempBans.length; i++) {
        let ban = tempBans[i];
        let userID = ban.info.userID;
        let since = ban.info.since;
        let realDuration = ban.info.duration;
        let today = new Date();

        if (today - since >= realDuration) {
          // ya pasó el tiempo, unban
          try {
            guild.members.unban(userID);
          } catch (err) {
            console.log(err);
          }
          tempBans[i].remove();

          let unBEmbed = new EmbedBuilder()
            .setAuthor(`Unban`, guild.iconURL())
            .setDescription(`
        **—** Usuario desbaneado: **${userID}**.
        **—** Razón: **${ban.info.reason}**.
            `)
            .setColor(Colores.verde);

          logs.send({ embeds: [unBEmbed] })
          console.log("Se ha desbaneado a", userID)
        }
      }
    }
  })

  // buscar encuestas
  GlobalDatas.find({ "info.type": "temporalPoll", "info.guild_id": guild.id }, async (err, polls) => {
    if (err) throw err;

    if (polls) {
      for (let i = 0; i < polls.length; i++) {
        const poll = polls[i].info;

        if (moment().isAfter(poll.until)) {
          let c = guild.channels.cache.find(x => x.id === poll.channel_id);
          let msg = await c.messages.fetch(poll.message_id);

          const reactions = msg.reactions.cache;

          let reactionsInPoll = await new Promise(async (resolve, reject) => {
            let count = {
              no: [],
              yes: []
            }

            for (const reaction of reactions) {

              let usersInThis = await reaction[1].users.fetch();

              if (reaction[0] === "❌") {
                usersInThis.forEach(async user => {
                  if (!user.bot) count.no.push(user.id)
                });
              } else {
                usersInThis.forEach(async user => {
                  if (!user.bot) count.yes.push(user.id)
                });
              }
            }
            resolve(count);
          })

          let textEmbed = new Embed(msg.embeds[1]);
          console.log(textEmbed)

          await msg.reactions.removeAll();

          // checkar que no hayan votos en ambos lados y si los hay, anularlos
          let yes = reactionsInPoll.yes.filter(x => !reactionsInPoll.no.includes(x))
          let no = reactionsInPoll.no.filter(x => !reactionsInPoll.yes.includes(x))

          textEmbed.defAuthor({ text: "La encuesta del STAFF terminó", title: true })
          textEmbed.defFooter({ text: "TERMINÓ" });
          textEmbed.defDesc(textEmbed.description + `\n\n**RESULTADOS:**`)
          textEmbed.defField(`✅ SÍ:`, `${yes.length}`, true)
          textEmbed.defField(`❌ NO:`, `${no.length}`, true)

          if (no.length === 0 && yes.length === 0) textEmbed.setFooter({ text: "TERMINÓ...! y... no... ¿votó nadie...? :(" });

          await msg.reply({ embeds: [textEmbed] });

          polls[i].remove();
        }
      }
    }
  })
  return;
}

/**
 * Add warns to an user
 * @param {string} v The ID of the user
 * @param {number} c The number of warns to add
 */
const AddWarns = function (v, c) {
  Warns.findOne({
    userID: v.id
  }, (err, victimWarns) => {
    if (err) throw err;

    if (!victimWarns) {
      const newWarn = new Warns({
        userID: v.id,
        warns: c
      });
      newWarn.save();
    } else {
      victimtotalWarns += c;
      victimWarns.save();
    }
  })
}

/**
 * Add Interest if the item does not ignore it.
 * @param {Object[]} author The Discord.JS User
 * @param {number} idUse The ID of the item to check
 */
const Interest = function (author, idUse) {
  DarkItems.findOne({
    id: idUse
  }, (err, item) => {
    TotalPurchases.findOne({
      userID: author.id,
      itemID: idUse
    }, (err, alli) => {

      if (item.ignoreInterest == false && !alli) {
        const newAll = new TotalPurchases({
          userID: author.id,
          itemID: idUse,
          quantity: 1,
          isDarkShop: true
        });

        return newAll.save();
      } else if (item.ignoreInterest == false && alli) {
        alli.quantity += 1;
        return alli.save();
      } else {
        // no hacer nada, se ignora el interés
        return;
      }
    })
  })
}

/**
 * Adds a temporary role into the database ands adds the role to the user.
 * @param {GuildMember} victimMember - The Discord.JS Member
 * @param {string} roleID - The ID of the temporary role
 * @param {(number | string)} duration The duration of the temporary role in ms.
 * - "permanent" for not being an temporary role.
 * @param {Number} [specialType=false] The special type of this temporary role.
 * @param {Number} [specialObjective=false] The objetive for this special type of temporary role.
 * @param {number} [specialValue=false] The value for the objetive of this special temporary role.
 * @returns Mongoose User document
 */
const LimitedTime = async function (victimMember, roleID = 0, duration, specialType = null, specialObjective = null, specialValue = null) {
  let role = victimMember.guild.roles.cache.find(x => x.id === roleID);
  let user = await Users.getOrCreate({ user_id: victimMember.id, guild_id: victimMember.guild.id });

  if (duration === Infinity) return victimMember.roles.add(role); // es un role permanente???

  let hoy = new Date();

  let toPush = {
    role_id: roleID,
    active_since: hoy,
    duration: duration,
    special: {
      type: specialType,
      objetive: specialObjective,
      value: specialValue
    }
  }

  user.data.temp_roles.push(toPush);
  await user.save();

  let lastAddedIndex = user.data.temp_roles.length - 1;
  if (role) victimMember.roles.add(role);

  // timeout, por si pasa el tiempo antes de que el bot pueda reiniciarse
  if (duration <= 2147483647) setTimeout(function () {
    if (role) victimMember.roles.remove(role);

    user.data.temp_roles.splice(lastAddedIndex, 1);
    user.save()
  }, duration);

  return user
}

/**
 * Adds a new subscription to the database and adds the role to the user.
 * @param {GuildMember} victimMember The Discord.JS GuildMember
 * @param {string} roleID The ID for the role given by the suscription
 * @param {Number} interval The interval of time in which the user will pay (ms)
 * @param {Number} jeffrosPerInterval The price the user will pay every interval
 * @param {string} subscriptionName The name of the suscription
 * @returns void
 */
const Subscription = async function (victimMember, roleID, interval, jeffrosPerInterval, subscriptionName) {
  let role = victimMember.guild.roles.cache.find(x => x.id === roleID);
  let user = await Users.getOrCreate({ user_id: victimMember.id, guild_id: victimMember.guild.id });

  let toPush = {
    role_id: role.id,
    active_since: new Date(),
    duration: interval,
    isSub: true,
    sub_info: {
      price: jeffrosPerInterval,
      name: subscriptionName,
      isCancelled: false
    }
  }

  await victimMember.roles.add(role);
  user.data.temp_roles.push(toPush);

  await user.save();

  return user
}

const VaultWork = function (vault, user, interaction, notCodeEmbed, client) { // mostrar y buscar un codigo no descifrado aún por el usuario
  if (user.data.unlockedVaults.length === vault.length) return interaction.editReply({ embeds: [notCodeEmbed.defFooter({ text: "Tienes todos los códigos en tus manos, impresionante..." })] })

  const unlocked = user.data.unlockedVaults;

  let code = vault[Math.floor(Math.random() * vault.length)];


  while (unlocked.find(x => x === code.id)) {
    code = vault[Math.floor(Math.random() * vault.length)];
  }

  let itemMap = new Map();
  code.hints.forEach((hint, index) => {
    itemMap.set(index, {
      hint
    })
  })

  const interactive = new InteractivePages({
    color: Colores.verde,
    addon: `{hint}`,
    footer: `Pista {ACTUAL} de {TOTAL} | /vault [codigo] para descifrar`
  }, itemMap, 1);

  return interactive.init(interaction);
}

const handleUploads = async function (client) {
  let guild, bellytChannel, belltwChannel, belltvChannel, role;

  if (client.user.id === Config.testingJBID) {
    guild = client.guilds.cache.find(x => x.id === "482989052136652800");
    bellytChannel = client.channels.cache.find(x => x.id === "881031615084634182");
    belltwChannel = client.channels.cache.find(x => x.id === "881031732369960990");
    belltvChannel = client.channels.cache.find(x => x.id === "881031774174588968");
    role = guild.roles.cache.find(x => x.id === "881028196282290256")
  } else {
    bellytChannel = client.channels.cache.find(x => x.id === Config.bellytChannel);
    belltwChannel = client.channels.cache.find(x => x.id === Config.belltwChannel);
    belltvChannel = client.channels.cache.find(x => x.id === Config.belltvChannel);
    role = guild.roles.cache.find(x => x.id === Config.bellRole)
  }

  // revisar si existe el globaldata
  let interval = ms("30s");
  let query = await GlobalDatas.findOne({
    "info.type": "bellNotification"
  });

  if (!query) {
    const newNotification = new GlobalDatas({
      info: {
        type: "bellNotification",
        postedVideos: [{ "what": "DELETETHIS" }],
        postedTweets: [{ "what": "DELETETHIS" }],
        postedOnLive: [{ "what": "DELETETHIS" }]
      }
    })

    await newNotification.save();
    query = await GlobalDatas.findOne({
      "info.type": "bellNotification"
    });
  }

  setInterval(async () => {
    let config = {
      youtube_channelId: "UCCYiF7GGja7iJgsc4LN0oHw",
      twitter_screenname: "JeffreyG__",
      twitch_username: "jeffreyg_"
    }

    // youtube
    let comentarios = ["Ha llegado el momento, chécalo para evitar que Jeffrey entre en depresión", "Dale like o comenta algo si te gustó lo suficiente :D", "Espero que nos veamos en la próxima, ¡y que no sea en 3 meses!", "BROOOO Está rebueno míralo, a lo bien.", "No sabría decir si es lamentable, espero que no, ¿por qué no lo ves para comprobarlo y me dices qué tal?"]
    let comentario = comentarios[Math.floor(Math.random() * comentarios.length)];

    google.youtube("v3").activities.list({
      key: process.env.YOUTUBE_TOKEN,
      part: "snippet, contentDetails",
      channelId: config.youtube_channelId
    })
      .then(async response => {
        //console.log(response.data.items[0])
        let item;

        itemLoop:
        for (let i = 0; i < response.data.items.length; i++) {
          const _item = response.data.items[i];

          if (_item.snippet.type === "upload") {
            item = response.data.items[i];
            break itemLoop;
          } else {
            item = null;
          }
        }

        if (!item) return;

        const data = item.snippet;
        const itemId = item.id;
        const videoId = item.contentDetails.upload.videoId;

        let noti = await GlobalDatas.findOne({
          "info.type": "bellNotification"
        });

        let posted = false;

        lastlinkLoop:
        for (let i = 0; i < noti.info.postedVideos.length; i++) {
          const video = noti.info.postedVideos[i];

          if (video.id === itemId) {
            posted = true;
            break lastlinkLoop;
          }
        }

        if (noti.info.postedVideos && posted) return;
        else {

          const videoLink = `https://www.youtube.com/watch?v=${videoId}`;

          let toPush = {
            title: data.title,
            id: itemId,
            link: videoLink,
            author: data.channelTitle
          }

          if ((noti.info.postedVideos.length === 1 && noti.info.postedVideos[0].what) || !noti.info.postedVideos) {
            noti.info.postedVideos[0] = toPush;
          } else {
            noti.info.postedVideos.push(toPush);
          }

          noti.markModified("info");
          await noti.save();

          let parsed = noti.info.postedVideos[noti.info.postedVideos.length - 1];
          if (!bellytChannel) return;

          bellytChannel.send({ content: `**:fire::zap:️¡NUEVO VÍDEO, ${role}!:zap:️:fire:**\n\n${comentario}\n\n➟ ${parsed.link}` });
        }

      })
      .catch(err => console.log("YOUTUBE", err));

    // twitter
    const twitterClient = new Twitter({
      consumer_key: process.env.TWITTER_API,
      consumer_secret: process.env.TWITTER_SECRET,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_SECRET
    });

    twitterClient.get('statuses/user_timeline', { screen_name: config.twitter_screenname, count: 5 }, async function (error, tweets, response) {
      if (error) throw error;
      const tweet = tweets[0]; // ultimo tweet de {config.twitter_screenname}
      const tweetId = tweet.id_str;
      const link = `https://twitter.com/${config.twitter_screenname}/status/${tweetId}`;

      let noti = await GlobalDatas.findOne({
        "info.type": "bellNotification"
      });

      let posted = false;
      lastlinkLoop:
      for (let i = 0; i < noti.info.postedTweets.length; i++) {
        const _tweet = noti.info.postedTweets[i];

        if (_tweet.id === tweetId) {
          posted = true;
          break lastlinkLoop;
        }
      }

      if (noti.info.postedTweets && posted) return;
      else {
        let toPush = {
          id: tweetId,
          link: link,
          author: tweet.user.screen_name,
          time: tweet.created_at
        }

        if ((noti.info.postedTweets.length === 1 && noti.info.postedTweets[0].what) || !noti.info.postedTweets) {
          noti.info.postedTweets[0] = toPush;
        } else {
          noti.info.postedTweets.push(toPush);
        }

        noti.markModified("info");
        await noti.save();

        let parsed = noti.info.postedTweets[noti.info.postedTweets.length - 1];
        let tweetDate = new Date(parsed.time)
        let time = moment(tweetDate).tz("America/Bogota");

        if (!belltwChannel) return;

        belltwChannel.send(`Jeffrey escribió un tweet **(${time})**\n\n\`[\` ${parsed.link} \`]\``);
      }

    });

    // twitch
    let saludos = ["Di hola", "Ven y saluda", "Llégate", "Esto no pasa todo el tiempo, ven"]
    let saludo = saludos[Math.floor(Math.random() * saludos.length)];
    const streamLink = `https://twitch.tv/${config.twitch_username}`;

    const authProvider = new ClientCredentialsAuthProvider(process.env.TWITCH_CLIENT, process.env.TWITCH_SECRET);
    const apiClient = new ApiClient({ authProvider });

    let streaming = await isStreaming(config.twitch_username);

    if (streaming) { // si está directo
      const stream = await getStream(config.twitch_username);
      const streamId = stream.id;

      const streamTitle = stream.title;

      let noti = await GlobalDatas.findOne({
        "info.type": "bellNotification"
      });

      let posted = false;

      lastVod:
      for (let i = 0; i < noti.info.postedOnLive.length; i++) {
        const _stream = noti.info.postedOnLive[i];

        if (_stream.id === streamId) {
          posted = true;
          break lastVod;
        }
      }

      if (noti.info.postedOnLive && posted) return console.log("ESTÁ EN DIRECTO, PERO YA SE HA PUBLICADO");
      else {
        let toPush = {
          title: streamTitle,
          link: streamLink,
          id: streamId
        }

        if ((noti.info.postedOnLive.length === 1 && noti.info.postedOnLive[0].what) || !noti.info.postedOnLive) {
          noti.info.postedOnLive[0] = toPush;
        } else {
          noti.info.postedOnLive.push(toPush);
        }

        noti.markModified("info");
        await noti.save();

        let parsed = noti.info.postedOnLive[noti.info.postedOnLive.length - 1];
        if (!belltvChannel) return;

        belltvChannel.send(`**🔴 ¡Jeffrey está en directo, ${role}!** 🔴\n\`➟\` **${parsed.title}**\n\n**${saludo} ➟ ${parsed.link} !! :D**`);
      }
    }

    async function isStreaming(username) {
      try {
        const user = await apiClient.users.getUserByName(username);

        if (!user) return false;
        return await user.getStream() !== null;
      } catch (err) {
        console.log(err)
      }
    }

    async function getStream(username) {
      const user = await apiClient.users.getUserByName(username);

      if (!user) return null;

      const stream = await user.getStream()

      if (!stream) return null;

      return stream;
    }
  }, interval);
}

/**
 * 
 * @param {*} interaction The Discord.JS Interaction that triggers the command
 * @param {String} dataSearch The Data to search in the setup of this Guild
 * - OPINION_LOGS_CHANNEL
 * @returns 
 */
const DataWork = async function (interaction, dataSearch) {

  const guild = interaction.guild;

  const docGuild = await Guilds.getOrCreate(guild.id);

  const insuficientSetup = new ErrorEmbed(interaction, { type: "insuficientSetup", data: { dataSearch } })

  let response;

  switch (dataSearch.toUpperCase()) {
    case "OPINION_LOGS_CHANNEL":
      if (docGuild.channels.opinion_logs) {
        response = guild.channels.cache.find(x => x.id === docGuild.channels.opinion_logs);
      }
      break;

    case "ADMIN_USER":
      let admins = docGuild.getAdmins();

      interaction.member.roles.cache.some(role => {
        console.log(admins)
        if (admins.includes(role.id)) response = role
      })
      break;

    default:
      response = null;
  }

  if (!response) insuficientSetup.send();
  return response;

}

/**
 * 
 * @param {*} interaction The Discord.JS Interaction that triggers the command
 * @param {String} query The Banning to search to this user in the Guild
 * @returns 
 */
const isBannedFrom = async function (interaction, query) {
  const user = await Users.getOrCreate({ user_id: interaction.user.id, guild_id: interaction.guild.id });

  let response = false;

  switch (query.toUpperCase()) {
    case "SUGGESTIONS":
    case "SUGGEST":
      response = user.isBannedFrom("suggestions");
      break;

    case "TICKETS":
      response = user.isBannedFrom("tickets");
      break;

    default:
      response = null;
  }

  if (response == null) return `COULD'T DETERMINE BANNED FROM '${query.toUpperCase()}'`;
  else
    return response;
}

/**
 * 
 * @param {String} toConfirm What is trying to be confirmed
 * @param {Array} dataToConfirm The text that will apear on the embed separated by "▸"
 * @param {CommandInteraction} interaction The Discord.JS Interaction that triggers the command
 * @returns {Promise<BaseInteraction | false>} Discord.JS Message if the confirmation is positive, if not, returns false
 */
const Confirmation = async function (toConfirm, dataToConfirm, interaction) {
  const client = interaction.client;

  let DescriptionString = "";
  let egEmbed = null;

  dataToConfirm.forEach(data => {
    if (data instanceof Embed) {
      egEmbed = data;
    } else
      DescriptionString += `\`▸\` ${data}\n`;
  });

  let confirmation = new Embed()
    .defAuthor({ text: `${toConfirm}?`, icon: interaction.guild.iconURL() })
    .defDesc(DescriptionString)
    .defColor(Colores.rojo);

  let embeds = [confirmation];
  if (egEmbed) embeds.push(egEmbed);

  let cancelEmbed = new Embed()
    .defDesc(`Cancelado.`)
    .defColor(Colores.negro);

  // componentes
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("confirmAction")
        .setLabel("Aceptar")
        .setStyle(ButtonStyle.Success)
        .setEmoji(client.EmojisObject.Allow.id),
      new ButtonBuilder()
        .setCustomId("cancelAction")
        .setLabel("Cancelar")
        .setStyle(ButtonStyle.Danger)
        .setEmoji(client.EmojisObject.Deny.id)
    )

  let msg = await interaction.editReply({ content: null, embeds, components: [row] }); // enviar mensaje de confirmación

  return new Promise(async (resolve, reject) => {
    const filter = async i => {
      try {
        if (!i.deferred) await i.deferUpdate()
      } catch (err) {
        //console.log("⚠️ %s", err)
      };

      return i.user.id === interaction.user.id &&
        (i.customId === "confirmAction" || i.customId === "cancelAction") &&
        i.message.id === msg.id;
    }

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: ms("1m"), max: 1 });

    const active = client.activeCollectors.find(y => {
      let x = y.collector;
      return x.channelId === collector.channelId && x.interactionType === collector.interactionType && y.userid === interaction.user.id
    });

    if (active) await active.collector.stop(EndReasons.OldCollector);

    client.activeCollectors.push({ collector, userid: interaction.user.id })

    collector.on("collect", async i => {
      if (i.customId === "confirmAction") {
        confirmation
          .defColor(Colores.verde)
          .defAuthor({ text: `${toConfirm}, continuando...`, icon: client.EmojisObject.Loading.url });

        await i.editReply({ embeds: [confirmation], components: [] });

        return resolve(interaction);
      } else {
        i.editReply({ embeds: [cancelEmbed], components: [] });

        return resolve(false);
      }
    })

    collector.on("end", async (i, r) => {
      let index = client.activeCollectors.findIndex(x => x.collector === collector && x.userid === interaction.user.id);
      if (!isNaN(index)) {
        client.activeCollectors.splice(index, 1);
      } else console.log(`🟥 NO SE ELIMINÓ DE LOS ACTIVECOLLECTORS !! {CONFIRMATION}`)

      if(r === EndReasons.OldCollector){
        await interaction.deleteReply()
        return resolve(false)
      }

      if (i.size == 0) {
        await interaction.editReply({ embeds: [cancelEmbed], components: [] })
        return resolve(false)
      }
    })
  })
}

/**
 * @param {*} user Mongoose User Query with one document
 * @param {Array} data Needed member, rule string, and proof object used for the infraction
 * @param {Boolean} [isSoftwarn=false] The infraction is a softwarn?
 */
const AfterInfraction = async function (user, data, isSoftwarn = false) {
  const { member, rule, proof, id, interaction } = data;

  if (!isSoftwarn) { // es un warn normal
    const warns = user.warns;
    const totalWarns = warns.length;

    const guild = member.guild;

    // acciones de automod
    let arrayEmbeds = [];

    let warnedEmbed = new Embed()
      .defAuthor({ text: `Warn`, icon: "https://cdn.discordapp.com/emojis/494267320097570837.png" })
      .defDesc(`
**—** Has sido __warneado__ por el STAFF.
**—** Warns actuales: **${totalWarns}**.
**—** Por infringir la regla: **${rule}**.
**—** **[Pruebas](${proof})**.
**—** ID de Warn: \`${id}\`.`)
      .defColor(Colores.rojo)
      .defFooter({ text: `Ten más cuidado la próxima vez!`, icon: 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png' });

    arrayEmbeds.push(warnedEmbed);
    let banMember = false;

    if (totalWarns >= 4) {
      let autoMod = new Embed()
        .defAuthor({ text: `Ban PERMANENTE.`, icon: "https://cdn.discordapp.com/emojis/537804262600867860.png" })
        .defDesc(`**—** PERMABAN.
**—** Warns actuales: **${totalWarns}**.
**—** Razón de ban (AutoMod): Muchos warns.
**—** Último warn por infringir la regla: **${rule}**.`)
        .defColor(Colores.rojo);

      arrayEmbeds.push(autoMod);
      banMember = true;
    } else

      if (totalWarns >= 3) {
        let autoMod = new Embed()
          .defAuthor({ text: `TempBan`, icon: "https://cdn.discordapp.com/emojis/537792425129672704.png" })
          .defDesc(`**—** Ban (24h).
**—** Warns actuales: **${totalWarns}**.
**—** Razón de ban (AutoMod): 3 warns acumulados.
**—** Último warn por infringir la regla: **${rule}**.`)
          .defColor(Colores.rojo);

        arrayEmbeds.push(autoMod);
        banMember = true


        GlobalDatas.findOne({
          "info.type": "temporalGuildBan",
          "info.userID": member.id,
          "info.guild_id": guild.id
        }, (err, guildBan) => {
          if (err) throw err;

          let now = new Date();

          if (!guildBan) {
            const newBan = new GlobalDatas({
              info: {
                type: "temporalGuildBan",
                userID: member.id,
                guild_id: guild.id,
                reason: `AutoMod. (Infringir "${rule}")`,
                since: now,
                duration: ms("1d")
              }
            });

            newBan.save();
          } else {
            // si ya existe (how) cambiar el since
            guildBan.info.since = now;
            guildBan.save();

          }

          setTimeout(function () {
            guild.unban(member.id)
          }, ms("1d"));
        });
      } else

        if (totalWarns >= 2) {
          let infoEmbed = new Embed()
            .defAuthor({ text: `Información`, icon: "https://cdn.discordapp.com/emojis/494267320097570837.png?v=1" })
            .defDesc(`**—** ${member.user.tag}, este es tu **warn número ❛ \`2\` ❜**
*— ¿Qué impacto tendrá este warn?*
**—** Tranquil@. Este warn no afectará en nada tu estadía en el servidor, sin embargo; el siguiente warn será un **ban de un día**.
**—** Te sugiero comprar un **-1 Warn** en la tienda del servidor. *( \`/shop\` para más info de precios, etc. )*`)
            .defColor(Colores.rojo);

          arrayEmbeds.push(infoEmbed);
        }

    // mensaje de warn normal
    // embed que se le envía al usuario por el warn

    let res = true

    await member.send({ embeds: arrayEmbeds })
      .catch(e => {
        res = false
        interaction.editReply({ embeds: [new ErrorEmbed({ type: "notSent", data: { tag: member.user.tag, error: e } })] })
      });

    if (banMember) console.log("Te baneo");//member.ban({reason: `AutoMod. (Infringir "${rule}")`});
    return true
  }/*  else {
    const { member, rule, proof } = data;

    let warnedEmbed = new Embed()
      .defAuthor(`¡Cuidado! (Softwarn)`, "https://cdn.discordapp.com/emojis/494267320097570837.png")
      .defDesc(`
**—** Esto es sólo un llamado de atención.
**—** Por infringir la regla: **${rule}**.
**—** [Pruebas](${proof.url})`)
      .defColor(Colores.rojo)
      .defFooter({text: `Si vuelves a cometer esta misma falla serás warneado, ten cuidado.`, icon: 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png'});

    member.send({ embeds: [warnedEmbed] })
      .catch(e => {
        interaction.editReply({ embeds: [new ErrorEmbed({ type: "notSent", data: { tag: member.user.tag, error: e } })] })
      });
  } */
}

/**
 * 
 * @param {*} client The Discord.JS Client
 * @param {String} guildId The Sting of the Guild#id where the commands is executed
 */
const DarkShopWork = async function (client, guildId) {
  const { Emojis } = client;

  const maxDaysNormalInflation = Config.daysNormalInflation;
  const maxDaysEventInflation = Config.daysEventInflation;
  const guild = client.guilds.cache.find(x => x.id === guildId);

  const dsChannel = client.user.id === Config.testingJBID ? client.channels.cache.find(x => x.id === "790431676970041356") : client.channels.cache.find(x => x.id === Config.dsChannel);
  const dsNews = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "790431614378704906") : guild.roles.cache.find(x => x.id === Config.dsnews);
  const logchannel = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "537095712102416384") : guild.channels.cache.find(x => x.id === Config.logChannel);

  // datas nuevas en caso de necesarias
  const today = new Date();

  let inflation = Number(Math.random() * 10 + 1).toFixed(2);
  if (Number(inflation) > 10) inflation = 10;

  const baseDuration = Number(Math.random() * maxDaysNormalInflation).toFixed(1); // duración máxima de inflacion

  // eventos
  const percentage = Math.random() * 100;
  const event = percentage >= 52 ? 0 : percentage >= 14 ? 1 : 2; // 0 baja, 1 sube, 2 igual

  const eventDuration = Number((Math.random() * maxDaysEventInflation) + 1).toFixed(1); // duración máxima de eventos

  const darkshop = await DarkShops.findOne({ guild_id: guildId }) ?? await new DarkShops({
    guild_id: guildId,
    inflation: {
      value: inflation,
      since: today,
      duration: Number(baseDuration)
    },
    event: {
      newinflation: await generateNewEventInflation(event),
      since: today,
      count: Number(eventDuration)
    }
  }).save();

  // leer y cambiar inflaciones si es necesario
  // INFLACIÓN NORMAL
  const oldDateInflation = new Date(darkshop.inflation.since);

  const pastDaysInflation = await DaysUntilToday(oldDateInflation);
  const actualInflation = darkshop.inflation.value;

  if (pastDaysInflation >= darkshop.inflation.duration) {
    darkshop.inflation.old = actualInflation;
    darkshop.inflation.since = today;
    darkshop.inflation.duration = baseDuration;
    darkshop.inflation.value = inflation;

    await darkshop.save();

    console.log("Se ha cambiado la inflación, ahora es", inflation, "|| era:", actualInflation);
  }

  // EVENTOS
  const oldDateEvent = new Date(darkshop.event.since);

  const pastDaysEvent = await DaysUntilToday(oldDateEvent);

  if (pastDaysEvent >= darkshop.event.count) {
    console.log("Ahora mismo hay un evento.")
    // enviar mensaje random de evento
    let newInflation = `**${darkshop.event.newinflation}%**`;
    let rndmEventSUBE = [
      `Estamos de suerte, se han devaluado los Jeffros, la inflación ha subido al ${newInflation}`,
      `Los Jeffros se levantaron con pie izquierdo, la inflación sube a ${newInflation}`,
      `Nuestro momento ha llegado, los Jeffros se han devaluado y la inflación sube a ${newInflation}`,
      `Hora de sacar nuestra artillería, han hecho que los Jeffros se devalúen, la inflacion sube a ${newInflation}`,
      `Esto no pasa muy seguido ¿verdad? hoy estamos de suerte, la inflación sube a ${newInflation}`,
      `Bastante espectacular, ¿no? la inflación ha subido a ${newInflation}`
    ];

    let rndmEventBAJA = [
      `Parece que algo en las oficinas ha hecho que la inflación baje al ${newInflation}`,
      `Mira que hay que tener mala suerte, se han regalado miles de Jeffros por todo el planeta y ha hecho que la inflación baje a ${newInflation}`,
      `Al otro lado de la moneda se le dio por fortalecerse, la inflación baja a ${newInflation}`,
      `Han intenado raidearnos, tuvimos que tomar decisiones, la inflación baja a ${newInflation}`,
      `La inflación baja a ${newInflation}. Hay que ver el lado positivo, con suerte nos va mejor para la próxima`,
      `Hay días buenos, y otras veces, sólo hay días. La inflación baja a ${newInflation}`
    ];

    let rndmEventIGUAL = [
      `Por poco... nos han intentado robar en una de nuestras sucursales, la inflación se queda en ${newInflation}`,
      `Parece que casi nos involucran en una mala jugada, la inflación queda en ${newInflation}`,
      `Casi que no lo logramos, pero la inflación queda en ${newInflation}`,
      `Menos mal, la cosa se puso difícil pero logramos hacer que la inflación quedase en ${newInflation}`,
      `¿Qué tal? Casi que nos hacen la jugada, pero somos mejores que ellos. La inflación se queda en ${newInflation}`,
      `Esto es increíble, logramos quedarnos en ${newInflation}, buen trabajo, equipo.`
    ];

    let rSube = rndmEventSUBE[Math.floor(Math.random() * rndmEventSUBE.length)];
    let rBaja = rndmEventBAJA[Math.floor(Math.random() * rndmEventBAJA.length)];
    let rIgual = rndmEventIGUAL[Math.floor(Math.random() * rndmEventIGUAL.length)];

    // revisar si baja, sube o se queda igual de acuerdo a la inflación actual

    const oldInflation = Number(darkshop.inflation.value);
    const eventInflation = Number(darkshop.event.newinflation);
    let actualEvent;

    if (eventInflation > oldInflation) {
      actualEvent = 1;
    } else if (eventInflation < oldInflation) {
      actualEvent = 0;
    } else {
      actualEvent = 2;
    }

    switch (actualEvent) {
      case 1:
        let embed = new Embed()
          .defAuthor({ text: `Evento`, icon: Config.darkLogoPng })
          .defDesc(rSube)
          .defColor(Colores.negro)
          .defFooter({ text: `La inflación SUBE.`, timestamp: true });

        dsChannel.send({ content: `${dsNews}`, embeds: [embed] });
        break;

      case 0:
        let embed2 = new Embed()
          .defAuthor({ text: `Evento`, icon: Config.darkLogoPng })
          .defDesc(rBaja)
          .defColor(Colores.negro)
          .defFooter({ text: `La inflación BAJA.`, timestamp: true });

        dsChannel.send({ content: `${dsNews}`, embeds: [embed2] });
        break;

      case 2:
        let embed3 = new Embed()
          .defAuthor({ text: `Evento`, icon: Config.darkLogoPng })
          .defDesc(rIgual)
          .defColor(Colores.negro)
          .defFooter({ text: `La inflación se MANTIENE.`, timestamp: true });

        dsChannel.send({ content: `${dsNews}`, embeds: [embed3] });
        break;
    }

    // aplicar el evento a la inflacion actual

    darkshop.inflation.old = oldInflation;
    darkshop.inflation.value = eventInflation;

    await darkshop.save();

    console.log("# Se ha actualizado la inflación debido al evento.")

    // crear de una el nuevo evento
    darkshop.event = {
      newinflation: await generateNewEventInflation(event),
      since: today,
      count: eventDuration
    }

    await darkshop.save();
  }

  // DURACION DE LOS DARKJEFFROS
  const darkusers = await Users.find({
    guild_id: guildId,
    "economy.dark.duration": { $gt: 0 }
  });

  darkusers.forEach(async darkuser => {
    const darkdata = darkuser.economy.dark;

    const pastDaysDJ = await DaysUntilToday(darkdata.dj_since);

    //console.log("Han pasado %s de %s días de %s", pastDaysDJ, darkdata.duration, darkuser.user_id);

    if (pastDaysDJ >= darkdata.duration) { // ya pasaron los días para cambiar los darkjeffros.
      let memberDJ = guild.members.cache.find(x => x.id === darkuser.user_id);

      if (!memberDJ) {
        console.log("No se encontró al usuario %s. Pero se eliminaron sus DarkJeffros", darkuser.user_id)
      }

      let deletedTag = memberDJ ? memberDJ.user.tag : `<AUSENTE> (${darkuser.user_id})`

      if (darkdata.darkjeffros === 0) {
        let log = new Embed()
          .defColor(Colores.verde)
          .defDesc(`**—** Se ha eliminado la Duración de DarkJeffros de ${deletedTag}.
**—** Desde: \`${darkdata.dj_since}\`.
**—** Duración: \`${darkdata.duration}\`.`)
          .defFooter({ text: "No se ha enviado mensaje al usuario porque sus darkjeffros eran 0.", timestamp: true });

        darkdata.dj_since = null;
        darkdata.duration = null;

        await darkuser.save();

        console.log("Se ha eliminado la duración de DJ de", deletedTag)
        logchannel.send({ embeds: [log] });
      } else {
        let log = new Embed()
          .defColor(Colores.verde)
          .defDesc(`**—** Se han eliminado los DarkJeffros de **${deletedTag}**.
**—** Desde: \`${darkdata.dj_since}\`.
**—** Duración: \`${darkdata.duration}\`.
**—** Tenía: **${Emojis.DarkJeffros}${darkdata.darkjeffros}**`)
          .defFooter({ text: "Mensaje enviado a la vez que al usuario", timestamp: true })

        let embed = new Embed()
          .defAuthor({ text: `...`, icon: Config.darkLogoPng })
          .defColor(Colores.negro)
          .defDesc(`**—** Parece que no has vendido todos tus DarkJeffros. Han sido eliminados de tu cuenta tras haber concluido los días estipulados. (\`${darkdata.duration} días.\`)`)
          .defFooter("▸ Si crees que se trata de un error, contacta al Staff.");

        darkdata.darkjeffros = 0;
        darkdata.dj_since = null;
        darkdata.duration = null;

        await darkuser.save();

        console.log("Se ha eliminado la duración de DJ de", deletedTag)

        // intentar enviar un mensaje al MD.
        memberDJ.send({ embeds: [embed] })
          .catch(err => {
            logchannel.send(`**${deletedTag} no recibió MD de DarkJeffros eliminados.**\n\`\`\`javascript\n${err}\`\`\``)
          });

        logchannel.send({ embeds: [log] });
      }
    }
  })

  return darkshop;

  async function generateNewEventInflation(event) { // nuevo evento de inflacion en caso de necesitarse
    let ds = await DarkShops.findOne({ guild_id: guildId }) ?? null
    const oldinflation = ds?.inflation.value ?? inflation; // tomar la inflación actual o la que se generó si no existe

    console.log("Se está creando un nuevo evento a futuro");

    let newinflation;

    if (event === 0) { // baja
      if (oldinflation < 1) {
        newinflation = Number(Math.random() * oldinflation).toFixed(2);

        let att = 0; // intentos máximos pa que no se muera si la inflacion es muy baja de por si
        while (newinflation < 1 && att < 15) {
          newinflation = Number(Math.random() * (inflation * 6)).toFixed(2);
          att++
        }

        if (newinflation < 1) newinflation = Number(Math.random() * 10).toFixed(2); // por si el while no es suficiente
        while (newinflation < 1) { // si sigue siendo menor a 1 hallar una inflacion normalmente
          newinflation = Number(Math.random() * 10).toFixed(2);
        }
      } else { // si es mayor a 1 entonces bajar la inflacion, ahora también puede ser menor a 1
        newinflation = Number(Math.random() * oldinflation).toFixed(2);
      }

    } else if (event === 1) { // sube
      newinflation = Number(Math.random() * 10).toFixed(2);

      while (newinflation <= oldinflation) {
        newinflation = Number(Math.random() * 10).toFixed(2);
      }

      if (newinflation > 10) newinflation = 10;
    } else { // igual
      newinflation = oldinflation;
    }

    if (newinflation < 0) newinflation = 0.1
    if (newinflation > 10) newinflation = 10

    console.log({ newinflation, event })

    return Number(newinflation);
  }
}

/**
 * 
 * @param {*} user The mongoose User
 * @param {*} author The Discord.JS User
 * @returns 
 */
const ValidateDarkShop = async function (user, author) {
  let guild = await Guilds.getOrCreate(user.guild_id);

  const r = [
    "{you}... No estás listo.",
    "No tienes el valor para hacerlo.",
    "Esto no va a terminar bien para ti, {you}.",
    "No eres digno.",
    "Olvídalo, {you}.",
    "Aún no, {you}."
  ];

  let res = r[Math.floor(Math.random() * r.length)];

  const desc = res.replace(
    new RegExp("{you}", "g"),
    `**${author.tag}**`
  );

  const notReady = new Embed()
    .defColor(Colores.rojo)
    .defDesc(desc)
    .defFooter({ text: `▸ Vuelve cuando seas nivel ${guild.settings.minimum.darkshop_level}.`});

  if (user.economy.global.level < guild.settings.minimum.darkshop_level) return { valid: false, embed: notReady }
  else return { valid: true, embed: null };
}

const DaysUntilToday = async function (date) {
  if (!date) return "?";

  let hoy = new Date();
  let oldDate = new Date(date); // fecha del dia inicial

  let diference1 = hoy - oldDate

  let response = diference1 / (1000 * 3600 * 24); // dias transcurridos

  if (isNaN(response)) return "?";
  else return Number(response.toFixed(1));
}

/**
 * 
 * @param {*} user The user's document inside the database
 * @param {*} item The item's object inside the database
 * @param {Boolean} [returnString=false] The function returns an String with the original price and the new one?
 * @param {Boolean} [isDarkShop=false] This is for the DarkShop?
 * @returns {String | Number} Returns a String or a Number in the case
 */
const DeterminePrice = async function (user, item, returnString, isDarkShop) {
  isDarkShop = isDarkShop || false;
  returnString = returnString || false;

  const discounts = [
    {
      forDarkShop: false,
      level: 20,
      discount: 15
    }
  ]

  const originalPrice = item.price;
  const user_level = user.economy.global.level;

  // nuevo precio a partir de interés
  const interest = item.interest;
  const searchInterest = x => (x.isDarkShop === isDarkShop) && (x.item_id === item.id);
  const totalpurchases = user.data.purchases.find(searchInterest) ? user.data.purchases.find(searchInterest).quantity : 0;

  const interestPrice = originalPrice + (totalpurchases * interest);
  let precio = interestPrice;

  // descuentos
  let query = discounts.filter(x => user_level >= x.level && x.forDarkShop === isDarkShop).sort(function (a, b) { // ordenar el array mayor a menor, por array.level
    if (a.level > b.level) {
      return -1;
    }
    if (a.level < b.level) {
      return 1;
    }

    return 0;
  });

  let discounted = false;

  if (query[0]) {
    discounted = true;
    precio -= ((precio) / 100) * query[0].discount;
  }


  precio = Math.floor(precio) > 0 ? Math.floor(precio) : Math.ceil(precio);

  if (returnString && discounted) {
    return `~~${interestPrice.toLocaleString("es-CO")}~~ ${precio.toLocaleString("es-CO")}`;
  } else {
    return precio;
  }
}

/**
 * 
 * @param {*} generalQuery Mongoose documents
 * @param {String} specificQuery The data inside that document 
 * @param {String} toCheck The parameter to check inside the specific query
 * @example
 * ```javascript
 * let query = await Model.find();
 * const id = await FindNewId(query, "data.example", "id");
 * const generalid = await FindNewId(query, "", "id");
 * ```
 * @returns {Number} Unique ID within the query
 */
const FindNewId = async function (generalQuery, specificQuery, toCheck) {
  // id
  let idsNow = []; // ids en uso actualmente
  let newId = 1;

  for (let i = 0; i < generalQuery.length; i++) {
    const document = generalQuery[i];

    let forEachLoop = document;
    let split = specificQuery.split(".");

    if (split && split.length >= 1 && split[0].length > 0) {
      for (let i = 0; i < split.length; i++) {
        const queryQ = split[i];

        forEachLoop = forEachLoop[queryQ]
      }

      if (Array.isArray(forEachLoop)) forEachLoop.forEach(i => {
        idsNow.push(i[toCheck]); // pushear cada id en uso
      });
      else idsNow.push(forEachLoop[toCheck]);

    } else {
      idsNow.push(forEachLoop[toCheck])
    }
  }

  while (idsNow.find(x => x === newId)) { // mientras se encuentre la id en las que ya están en uso sumar una hasta que ya no lo esté
    newId++;
  }

  return newId;
}

/**
 * 
 * @param {GuildMember} member The Discord.JS Member to check for benefit
 * @param {Array} [objetivesToCheck=["any"]] The objetive of boost to check.
 * - jeffros
 * - exp
 * - all
 * - any
 * @returns {Boolean} This Member already has a temp role with the objetive searched for.
 */
const WillBenefit = async function (member, objetivesToCheck) {
  objetivesToCheck = objetivesToCheck ?? ["any"];

  const user = await Users.findOne({
    user_id: member.id,
    guild_id: member.guild.id
  });

  const temp_roles = user.data.temp_roles;

  let hasBoost = false;

  temp_roles.forEach(temprole => {
    const special = temprole.special;
    if (special) {
      objetivesToCheck.forEach(objetiveToCheck => {
        switch (objetiveToCheck) {
          case BoostObjetives.Jeffros:
          case BoostObjetives.Exp:
          case BoostObjetives.All:
            if (special.objetive === objetiveToCheck) hasBoost = true;
            break;

          case "any":
            if (special.objetive === BoostObjetives.Jeffros ||
              special.objetive === BoostObjetives.Exp ||
              special.objetive === BoostObjetives.All) hasBoost = true;
            break;

          default:
            hasBoost = false;
            break;
        }
      })
    }
  });

  return hasBoost;
}

const importImage = function (filename) {
  let file = new AttachmentBuilder(`./src/resources/imgs/${filename.toUpperCase()}.png`, { name: `${filename.toLowerCase()}.png` });
  return {
    attachment: `attachment://${filename.toLowerCase()}.png`,
    file: file
  }
}

/**
 * 
 * @param {Number} ms MS of sleep
 * @returns {Promise<void>}
 */
const Sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Obtén un item aleatorio de un Array
 * @param {Array} array The Array of items to find
 * @returns {any}
 */
const GetRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
}

async function sendLog(logChannel, embed) {
  let msg = await logChannel.send({ embeds: [embed], content: null, components: [] });
  return msg;
}

async function createEmbedWithParams(commandTree, guild, params, already) {
  const docGuild = await Guilds.findOne({ guild_id: guild.id }) ?? await new Guilds({ guild_id: guild.id }).save();
  already = already ?? "";

  let embed = new Embed()
    .defAuthor({ text: `▸ /${commandTree.name}`, icon: guild.iconURL() })
    .defColor(Colores.nocolor)
    .defFooter({ text: "<> Obligatorio () Opcional" });

  let DescriptionString = `▸ El uso correcto es: /${commandTree.name} ${already}`;
  for (let i = already.split(" ").length - 1; i < params.length; i++) {
    const param = params[i]

    if (!param.optional) {
      DescriptionString += ` <${param.display ?? param.name}>`
    } else {
      DescriptionString += ` (${param.display ?? param.name})`
    }
  }

  embed.defDesc(DescriptionString);

  return embed;
}

async function switchParams(param, arg, args, message, guild, member, client, i) { // EL QUE SE USA EN LOS COMANDOS
  let toReturn;
  switch (param.type) {
    case "Member":
      // buscar por mención, o id
      toReturn = message.mentions.members.first() ?? guild.members.cache.find(x => x.id === arg);

      if (!toReturn && (arg.toLowerCase() === "yo" || arg.toLowerCase() === "me")) {
        toReturn = message.member;
      }

      break;

    case "Attachment":
      if (message.attachments.size != 0) {
        toReturn = message.attachments.first();
      }
      break;

    case "NotSelfMember":
      // no puede ser el mismo usuario que ejecuta el comando
      let possibleReturn = message.mentions.members.first() ? message.mentions.members.first() : guild.members.cache.find(x => x.id === arg);
      toReturn = possibleReturn.id != member.id ? possibleReturn : null;
      break;

    case "Role":
      // buscar por mención, o id
      toReturn = message.mentions.roles.first() ? message.mentions.roles.first() : guild.roles.cache.find(x => x.id === arg);
      break;

    case "Emoji":
      let isCustom = arg.length > 5 ? true : false;

      if (isCustom) {
        let emote = arg.match(/\d/g); // sacando los números del emoji
        emote = emote.join("");
        toReturn = guild.emojis.cache.find(x => x.id === emote);
      } else {
        toReturn = arg;
      }
      break;

    case "Channel":
      toReturn = message.mentions.channels.first() ? message.mentions.channels.first() : guild.channels.cache.find(x => x.id === arg);
      break;

    case "Message":
      const message_channel = response.find(x => x.param === param.requires_param).data;
      toReturn = await message_channel.messages.fetch(arg);
      break;

    case "MessageLink":
      const linkArray = arg.split("/");
      const numbers = linkArray.filter(element => !isNaN(element) && element.length > 0);

      const actualguild = client.guilds.cache.find(x => x.id === numbers[0]);
      const actualchannel = actualguild.channels.cache.find(x => x.id === numbers[1]);
      const actualmessage = await actualchannel.messages.fetch(numbers[2]).catch(err => console.log());

      toReturn = actualmessage;
      break;

    case "Guild":
      if (Number(arg)) toReturn = client.guilds.cache.find(x => x.id === arg);
      break;

    case "String":
      toReturn = arg;
      break;

    case "JoinString":
      toReturn = args.join(" ");

      if (i != 0) {
        for (let k = 0; k < i; k++) {
          toReturn = toReturn.slice(args[k].length + 1)
        }
      }
      break;

    case "Array":
      toReturn = arg.split(`${param.split}`)
      break;

    case "Number":
      if (Number(arg)) toReturn = Number(arg);
      break;

    case "NaturalNumber":
      if (Math.floor(arg) > 0) {
        toReturn = Math.floor(arg)
      }
      break;

    case "NaturalNumberNotInfinity":
      if (Math.floor(arg) > 0 && Number(arg) != Infinity) {
        toReturn = Math.floor(arg)
      }
      break;

    case "Time":
      if (Number(arg) === Infinity) toReturn = Infinity;
      else toReturn = ms(arg);
      break;

    case "Boolean":
      arg = arg.toLowerCase();
      if (arg === "1" || arg === "true" || arg === "si" || arg === "sí" || arg === "yes" || arg === "y" || arg === "s") toReturn = true;
      else if (arg === "0" || arg === "false" || arg === "no" || arg === "no" || arg === "n") toReturn = false;
      break;

    case "Options":
      let possibleOptions = param.options;

      optionsLoop:
      for (let i = 0; i < possibleOptions.length; i++) {
        const option = possibleOptions[i];

        if (option === arg) {
          toReturn = arg;
          break optionsLoop;
        }
      }
      break;

    default:
      toReturn = "FATAL"
  }

  return toReturn;
}

async function validateAnArg(param, arg, args, message, guild, member, client) {
  let toReturn = await switchParams(param, arg, args, message, guild, member, client)

  return toReturn != "FATAL" && toReturn ? true : false;
}

const isOnMobible = function (message) {
  return message.member.presence &&
    message.member.presence.clientStatus &&
    message.member.presence.clientStatus.mobile === "online" &&
    !message.member.presence.clientStatus.desktop ? true : false;
}

module.exports = {
  GetChangesAndCreateFields,
  FetchAuditLogs,
  intervalGlobalDatas,
  AddWarns,
  Interest,
  VaultWork,
  findLvls5,
  LimitedTime,
  Subscription,
  handleUploads,
  DataWork,
  isBannedFrom,
  Confirmation,
  AfterInfraction,
  InteractivePages,
  DarkShopWork,
  ValidateDarkShop,
  DeterminePrice,
  FindNewId,
  DaysUntilToday,
  WillBenefit,
  importImage,
  GenerateLog,
  isOnMobible,
  RandomCumplido,
  Sleep,
  GetRandomItem
}
