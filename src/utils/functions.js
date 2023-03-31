const { ActivityType, ButtonStyle, OverwriteType, PermissionsBitField, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, Guild, GuildMember, CommandInteraction, BaseInteraction, Message, Client, time, hyperlink, codeBlock, PresenceUpdateStatus } = require("discord.js");

const Colores = require("../resources/colores.json");
const Cumplidos = require("../resources/cumplidos.json");

const ErrorEmbed = require("../utils/ErrorEmbed");
const Embed = require("../utils/Embed");
const InteractivePages = require("../utils/InteractivePages");
const DarkShop = require("../utils/DarkShop");

const ms = require("ms");
const moment = require("moment-timezone");

/* ##### MONGOOSE ######## */

const { Users, Guilds, DarkShops, Shops, GlobalDatas } = require("mongoose").models;

// JEFFREY BOT NOTIFICATIONS
const { google } = require("googleapis");
const { ApiClient } = require("@twurple/api");
const { AppTokenAuthProvider  } = require("@twurple/auth");
const { BoostObjetives, ChannelModules, LogReasons } = require("./Enums");
const Log = require("./Log");
const { Bases } = require("../resources");
const Commands = require("../../Commands");
const Collector = require("./Collector");

/* ##### MONGOOSE ######## */
const RandomCumplido = function (force = null) {
  return force ? Cumplidos.c[force] : Cumplidos.c[Math.floor(Math.random() * Cumplidos.c.length)];
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
  //console.log("----------------")


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
  if(!guild) return console.log("🔴 No se especificó guild")
  return new Promise(async (resolve, reject) => {
    let toReturn = [];

    for (let i = 0; i < types.length; i++) {
      const type = types[i];

      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type });

      const fetched = fetchedLogs.entries.first();

      if (fetched?.reason?.startsWith("[BULK]")) resolve(null);
      if (fetched === undefined) {
        //console.error("⚠️ No se encontró ningún log con el tipo", type);
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
 * @param {Guild} guild 
 * @param options 
 * @returns {Promise<Message|null>}
 */
const GenerateLog = async function (guild, options = {
  logType: ChannelModules.GuildLogs, logReason: LogReasons.Logger, header: "", footer: "", description: [], header_icon: "", footer_icon: "", color: "", fields: []
}) {
  let { logType, logReason, header, footer, description, header_icon, footer_icon, color, fields } = options;

  if (!footer) console.log("🔴 NO TIENE FOOTER", options)
  logType = logType ?? ChannelModules.GuildLogs;
  logReason = logReason ?? LogReasons.Logger;
  description = description ?? [];
  header_icon = header_icon ?? guild.iconURL({ dynamic: true });

  const embed = new Embed()
    .defAuthor({ text: header, icon: header_icon })
    .defFooter({ text: footer, icon: footer_icon, timestamp: true })
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

  if (!docGuild) return //console.error("🔴 No se ha configurado un logchannel en el servidor", guild.name);

  try {
    return await new Log()
      .setGuild(guild)
      .setTarget(logType)
      .setReason(logReason)
      .send({ embeds: [embed] })
  } catch (err) {
    console.log(err);
  }

}

/**
 * GlobalData work
 * @param {Guild} guild The Guild where the interval shall be executed
 * @param {boolean} [justTempRoles=false] Just execute interval of temporal roles
 * @returns void
 */
const GlobalDatasWork = async function (guild, justTempRoles = false) {
  const { Emojis, EmojisObject } = guild.client;
  const doc = await Guilds.getOrCreate(guild.id);

  const bdRole = doc.getRoleByModule("birthday") ? await guild.roles.fetch(doc.getRoleByModule("birthday")).catch(err => {
    new Log()
      .setGuild(guild)
      .setReason(LogReasons.Error)
      .setTarget(ChannelModules.StaffLogs)
      .send({
        embeds: [
          new ErrorEmbed()
            .defDesc(`**No se pudo conseguir el role de cumpleaños**\n${codeBlock("json", err)}`)
        ]
      })
  }) : null;

  const staffRoles = guild.roles.cache.filter(role => {
    return doc.getStaffs().find(x => x === role.id);
  })

  const members = guild.members.cache;
  //console.log(members.values())
  // buscar roles temporales & cumpleaños
  for await (const member of members.values()) {
    if (member.user.bot) continue

    let dbUser = await Users.getOrCreate({
      user_id: member.id,
      guild_id: guild.id
    });

    let temp_roles = dbUser?.data.temp_roles ?? [];
    let birthday = dbUser?.data.birthday.locked;
    let birthday_reminders = dbUser?.getBirthdayReminders() ?? [];
    let temproledeletions = await GlobalDatas.getTempRoleDeletions(member.id, guild.id) ?? [];

    for (let i = 0; i < temp_roles.length; i++) {
      const temprole = temp_roles[i];
      let role = guild.roles.cache.find(x => x.id === temprole.role_id);
      let until = temprole.active_until;

      if (moment().isAfter(until)) {

        if (!temprole.isSub) {
          // sacarle el role
          console.log("🟢 Ha pasado el tiempo del temprole %s", temprole);
          try {
            if (role) await member.roles.remove(role);
          } catch (err) {
            new Log()
              .setGuild(guild)
              .setReason(LogReasons.Error)
              .setTarget(ChannelModules.StaffLogs)
              .send({
                embeds: [
                  new ErrorEmbed().defDesc(`**No se pudo eliminar el role de un temprole**\n${codeBlock("json", err)}`)
                ]
              })
          }

          // eliminar el temprole de la db
          dbUser.data.temp_roles.splice(i, 1);
          dbUser.save();
        } else { // es una suscripción
          // TODO: REWORK NEEDED
          return console.log("REWORK DE LAS SUBS")
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

    birthdayIf:
    if (birthday) {
      if (!doc.moduleIsActive("functions.birthdays")) break birthdayIf;

      if (dbUser?.isBirthday()) { // actualMonth + 1 ( 0 = ENERO && 11 = DICIEMBRE )
        if (!bdRole) return new Log()
          .setGuild(guild)
          .setReason(LogReasons.Error)
          .setTarget(ChannelModules.StaffLogs)
          .send({
            embeds: [
              new ErrorEmbed()
                .defDesc("**No se pudo agregar el role, no se pudo conseguir el role de cumpleaños**")
            ]
          })

        // ES EL CUMPLEAÑOS
        if (!member.roles.cache.get(bdRole?.id)) member.roles.add(bdRole);
      } else {
        // revisar si tiene el rol de cumpleaños, entonces quitarselo
        if (member.roles.cache.get(bdRole?.id)) member.roles.remove(bdRole);
      }
    }

    // hay roles eliminados de manera temporal
    for (const deletion of temproledeletions) {
      if (moment().isAfter(deletion.info.until)) {
        let temproleIndex = dbUser.data.temp_roles.findIndex(x => {
          if (deletion.tempRoleObjectId) {
            return x._id === deletion.tempRoleObjectId;
          }
          if (deletion.info.boost && x.role_id === deletion.info.role_id) {
            return x.special.objetive === deletion.info.boost && x.role_id === deletion.info.role_id && x.special.disabled === true
          } else {
            return x.special.disabled === true;
          }
        })
        if (deletion.info.role_id) member.roles.add(deletion.info.role_id)

        if (temproleIndex != -1) {
          dbUser.data.temp_roles[temproleIndex].special.disabled = false;
          dbUser.markModified("data")
          dbUser.save();
        }

        deletion.deleteOne();
      }
    }

    for (const reminder_info of birthday_reminders) {
      const reminder = reminder_info.id
      const birthday_member = guild.members.cache.get(reminder);
      let birthday_query = await Users.getOrCreate({ user_id: reminder, guild_id: guild.id });
      if (birthday_query?.isBirthday() && !reminder_info.reminded) {
        member.send({
          embeds: [
            new Embed()
              .defAuthor({ text: `Hola`, icon: EmojisObject.Hola.url })
              .defDesc(`¡Vengo a recordarte que ${birthday_member} está de cumpleaños hoy!`)
              .defFooter({
                text: `Recibiste este mensaje porque quisiste que te lo recordara, para dejar de recibir esto usa /stats usuario:@${birthday_member.user.username} y presiona el botón de recordatorios`,
                icon: guild.iconURL({ dynamic: true }),
                timestamp: true
              })
              .defColor(Colores.verdeclaro)
          ]
        })
          .catch(err => {
            console.log(err)
            console.log("⚠️ No se pudo enviar el recordatorio a %s", member.user.tag)
            console.log("⚠️ Se eliminará el recordatorio")

            dbUser.data.birthday_reminders.splice(dbUser.getBirthdayReminders().findIndex(x => x === reminder), 1)
            dbUser.save();
          })

        reminder_info.reminded = true;
        dbUser.save();
      } else if (!birthday_query?.isBirthday() && reminder_info.reminded) {
        reminder_info.reminded = false;
        dbUser.save();
      }
    }
  }

  if (justTempRoles) return;

  // buscar items deshabilitados temporalmente
  Shops.getOrCreate(guild.id).then((shop) => {
    for (const item of shop.items) {
      if (moment().isAfter(item.disabled_until)) {
        item.disabled = false;
        item.disabled_until = null;
      }
    }

    shop.save();
  })

  DarkShops.getOrNull(guild.id).then((shop) => {
    if (!shop) return
    for (const item of shop?.items) {
      if (moment().isAfter(item.disabled_until)) {
        item.disabled = false;
        item.disabled_until = null;
      }
    }

    shop.save();
  })

  // buscar temp bans
  let tempBans = await GlobalDatas.find({
    "info.type": "temporalGuildBan",
    "info.guild_id": guild.id
  });

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
          console.log("🟢 Se ha desbaneado a %s", userID)
        } catch (err) {
          console.log(err);
        }
        ban.deleteOne();

        let unBEmbed = new Embed()
          .defAuthor({ text: `Unban`, icon: guild.iconURL() })
          .defDesc(`
**—** Usuario desbaneado: **${userID}**.
**—** Razón: **${ban.info.reason}**.
            `)
          .defColor(Colores.verde);

        try {
          await new Log(guild)
            .setGuild(guild)
            .setTarget(ChannelModules.ModerationLogs)
            .setReason(LogReasons.Ban)
            .send({ embeds: [unBEmbed] })
        } catch (err) {
          console.log(err)
        }
      }
    }
  }

  // buscar encuestas
  let polls = await GlobalDatas.find({ "info.type": "temporalPoll", "info.guild_id": guild.id });
  for (let i = 0; i < polls.length; i++) {
    const poll = polls[i].info;

    if (moment().isAfter(poll.until)) {
      let c = guild.channels.cache.find(x => x.id === poll.channel_id);
      let msg = await c.messages.fetch(poll.message_id);



      /* const reactions = msg.reactions.cache;

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
      }) */

      const { yes, no } = poll;

      let textEmbed = new Embed()
        .defColor(Colores.verdeclaro)
        .defAuthor({ text: "La encuesta del STAFF terminó:", title: true })
        .defDesc(poll.poll + `\n\n**LOS USUARIOS DICEN:**`)
        .defField(`${msg.client.Emojis.Check} SÍ:`, `${yes.length}`, true)
        .defField(`${msg.client.Emojis.Cross} NO:`, `${no.length}`, true);

      await msg.reactions.removeAll();

      if (no.length === 0 && yes.length === 0) textEmbed.setFooter({ text: "TERMINÓ...! y... no... ¿votó nadie...? :(" });

      let replyMsg = await msg.reply({ embeds: [textEmbed] });

      const row = new ActionRowBuilder()
        .setComponents(
          new ButtonBuilder()
            .setLabel("Resultados")
            .setURL(replyMsg.url)
            .setStyle(ButtonStyle.Link)
        )

      msg.edit({ components: [row] });

      polls[i].deleteOne();
    }
  }

  // buscar tickets sin respuesta
  ticketReminder:
  for (const ticket of doc.data.tickets) {
    if (!doc.moduleIsActive("functions.staff_reminders")) break ticketReminder;
    if (ticket.end_date) continue;

    let lastReminded = ticket.last_reminded ? moment(ticket.last_reminded) : ticket.creation_date;
    let dayDiff = moment().diff(lastReminded, "d");

    if (dayDiff >= doc.settings.functions.ticket_remind) { // si la dif se cumple con la config, recordar
      let embed = new Embed()
        .defAuthor({ text: "Recordatorio de Ticket", icon: guild.iconURL({ dynamic: true }) })
        .defDesc(`Hay un ticket que no se ha cerrado por más de ${doc.settings.functions.ticket_remind} días (${dayDiff}d).`)
        .defField(ticket.type, `**—** Creado por ${guild.members.cache.get(ticket.created_by)}.
**—** ${guild.channels.cache.get(ticket.channel_id)}, el ${time(ticket.creation_date)}`)
        .defColor(Colores.verde)

      await new Log()
        .setTarget(ChannelModules.StaffLogs)
        .setReason(LogReasons.Logger)
        .setGuild(guild)
        .send({ content: `${staffRoles.toJSON().join(", ")}`, embed })

      ticket.last_reminded = new Date();
    }
  }

  suggestionReminder:
  for (const suggestion of doc.data.suggestions) {
    if (!doc.moduleIsActive("functions.staff_reminders")) break suggestionReminder;
    if (typeof suggestion.accepted === "boolean") continue;

    let lastReminded = suggestion.last_reminded ? moment(suggestion.last_reminded) : suggestion.creation_date;
    let dayDiff = moment().diff(lastReminded, "d");
    let channel = await guild.channels.fetch(suggestion.channel_id);
    let message = await channel.messages.fetch(suggestion.message_id);

    if (dayDiff >= doc.settings.functions.sug_remind) { // si la dif se cumple con la config, recordar
      let embed = new Embed()
        .defAuthor({ text: "Recordatorio de sugerencia", icon: guild.iconURL({ dynamic: true }) })
        .defDesc(`Hay una sugerencia que no ha sido respondida por más de ${doc.settings.functions.sug_remind} días (${dayDiff}d).`)
        .defField(`ID: ${suggestion.id}`, `**—** Sugerencia por ${guild.members.cache.get(suggestion.user_id)}.
**—** ${hyperlink("Mensaje de sugerencia", message.url)}, el ${time(suggestion.creation_date)}`)
        .defColor(Colores.verde)

      await new Log()
        .setTarget(ChannelModules.StaffLogs)
        .setReason(LogReasons.Logger)
        .setGuild(guild)
        .send({ content: `${staffRoles.toJSON().join(", ")}`, embed })

      suggestion.last_reminded = new Date();
    }
  }

  await doc.save();
  return;
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

  let until = moment().add(duration, "ms").toDate();

  let toPush = {
    role_id: roleID,
    active_until: until,
    special: {
      type: specialType,
      objetive: specialObjective,
      value: specialValue
    }
  }

  try {
    if (role) await victimMember.roles.add(role);
  } catch (err) {
    throw new Error(err);
  }

  user.data.temp_roles.push(toPush);
  await user.save();

  let lastAddedIndex = user.data.temp_roles.length - 1;

  // timeout, por si pasa el tiempo antes de que el bot pueda reiniciarse
  if (duration <= 2147483647) setTimeout(async function () {
    try {
      if (role) await victimMember.roles.remove(role);

      user.data.temp_roles.splice(lastAddedIndex, 1);
      await user.save();
    } catch (err) {
      throw new Error(err);
    }
  }, duration);

  return user
}

/**
 * @deprecated TODO: Rework
 * 
 * Adds a new subscription to the database and adds the role to the user.
 * @param {GuildMember} victimMember The Discord.JS GuildMember
 * @param {string} roleID The ID for the role given by the suscription
 * @param {Number} interval The interval of time in which the user will pay (ms)
 * @param {Number} jeffrosPerInterval The price the user will pay every interval
 * @param {string} subscriptionName The name of the suscription
 */
const Subscription = async function (victimMember, roleID, interval, jeffrosPerInterval, subscriptionName) {
  return new Error("Subscriptions are not enabled in 2.0.0");

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

const VaultWork = function (vault, user, interaction, notCodeEmbed) { // mostrar y buscar un codigo no descifrado aún por el usuario
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

/**
 * @param {Client} client 
 */
const handleUploads = async function (client) {

  for await (const guild of client.guilds.cache.values()) {
    if (guild.id != Bases.owner.guildId && guild.id != Bases.dev.guild) continue;

    const doc = await Guilds.getOrCreate(guild.id);

    const bellytChannel = client.channels.cache.get(doc.getChannel("notifier.youtube_notif"));
    const belltvChannel = client.channels.cache.get(doc.getChannel("notifier.twitch_notif"));

    const ytRole = guild.roles.cache.get(doc.getRole("notifications.youtube"));
    const ytShortsRole = guild.roles.cache.get(doc.getRole("notifications.youtube_shorts"));
    const tvRole = guild.roles.cache.get(doc.getRole("notifications.twitch"));

    // revisar si existe el globaldata
    let interval = ms("30s");
    let noti = await GlobalDatas.findOne({
      "info.type": "bellNotification"
    });

    if (!noti) {
      const newNotification = new GlobalDatas({
        info: {
          type: "bellNotification",
          lastVideo: null,
          lastTweet: null,
          lastLive: null
        }
      })

      await newNotification.save();
      noti = await GlobalDatas.findOne({
        "info.type": "bellNotification"
      });
    }

    const config = {
      youtube_channelId: "UCCYiF7GGja7iJgsc4LN0oHw",
      twitter_screenname: "JeffreyG__",
      twitch_username: "jeffreyg_"
    }

    let changed = false;
    if (bellytChannel && belltvChannel) setInterval(async () => {
      // youtube
      let comentarios = ["Ha llegado el momento, chécalo para evitar que Jeffrey entre en depresión", "Dale like o comenta algo si te gustó lo suficiente :D", "Espero que nos veamos en la próxima, ¡y que no sea en 3 meses!", "BROOOO Está rebueno míralo, a lo bien.", "No sabría decir si es lamentable, espero que no, ¿por qué no lo ves para comprobarlo y me dices qué tal?"]
      let short_comentarios = ["Venga va, que es menos de un minuto chécalo."]

      let comentario = GetRandomItem(comentarios);
      let short_comentario = GetRandomItem(short_comentarios);

      google.youtube("v3").activities.list({
        key: process.env.YOUTUBE_TOKEN,
        part: "snippet, contentDetails",
        channelId: config.youtube_channelId
      })
        .then(async response => {
          let item;

          itemLoop:
          for (let i = 0; i < response.data.items.length; i++) {
            const _item = response.data.items[i];

            if (_item.snippet.type === "upload") {
              item = _item;
              break itemLoop;
            } else {
              item = null;
            }
          }
          if (!item) return;

          const itemId = item.id;
          const videoId = item.contentDetails.upload.videoId;
          const videoLink = `https://www.youtube.com/watch?v=${videoId}`;

          if (noti.info.lastVideo === itemId) return; // ya se envió la noti
          else {
            fetch(`https://www.youtube.com/shorts/${videoId}`).then(res => {
              let isShort = res.status === 200 ? true : false;

              changed = true;
              noti.info.lastVideo = itemId;

              if (isShort) {
                bellytChannel.send({ content: `**¡NUEVO SHORT, ${ytShortsRole}!**\n\n${short_comentario}\n\n➟ https://www.youtube.com/shorts/${videoId}` });
              } else {
                bellytChannel.send({ content: `**:fire::zap:️¡NUEVO VÍDEO, ${ytRole}!:zap:️:fire:**\n\n${comentario}\n\n➟ ${videoLink}` });
              }
            });
          }
        })
        .catch(err => console.log("YOUTUBE", err));

      // twitch
      let saludos = ["Di hola", "Ven y saluda", "Llégate", "Esto no pasa todo el tiempo, ven"]
      let saludo = GetRandomItem(saludos);
      const streamLink = `https://twitch.tv/${config.twitch_username}`;

      const authProvider = new AppTokenAuthProvider (process.env.TWITCH_CLIENT, process.env.TWITCH_SECRET);
      const apiClient = new ApiClient({ authProvider });

      let streaming = await isStreaming(config.twitch_username);

      if (streaming) { // si está directo
        const stream = await getStream(config.twitch_username);

        const streamId = stream.id;
        const streamTitle = stream.title;

        if (noti.info.lastLive === streamId) return console.log("ESTÁ EN DIRECTO, PERO YA SE HA PUBLICADO");
        else {
          changed = true;
          noti.info.lastLive = streamId;

          belltvChannel.send(`**🔴 ¡Jeffrey está en directo, ${tvRole}!** 🔴\n\`➟\` **${streamTitle}**\n\n**${saludo} ➟ ${streamLink} !! :D**`);
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

      if (changed) {
        noti.markModified("info")
        await noti.save().then(res => {
          console.log(res.info);
        });
      }
    }, interval);
  }


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
    .defAuthor({ text: `¿${toConfirm}?`, icon: interaction.guild.iconURL() })
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
        .setEmoji(client.EmojisObject.Check.id),
      new ButtonBuilder()
        .setCustomId("cancelAction")
        .setLabel("Cancelar")
        .setStyle(ButtonStyle.Danger)
        .setEmoji(client.EmojisObject.Cross.id)
    )

  let msg = await interaction.editReply({ content: null, embeds, components: [row] }).catch(err => { console.log(err) }); // enviar mensaje de confirmación

  if (!msg) return null;

  return new Promise(async (resolve, reject) => {
    const filter = async i => {
      return i.user.id === interaction.user.id &&
        (i.customId === "confirmAction" || i.customId === "cancelAction") &&
        i.message.id === msg.id;
    }

    const collector = new Collector(interaction, { filter, max: 1 }).onEnd((collected, reason) => {
      if (collected.size == 0) {
        interaction.editReply({ embeds: [cancelEmbed], components: [] })
        return resolve(false)
      }
    }).raw();

    collector.on("collect", async i => {
      if (i.customId === "confirmAction") {
        confirmation
          .defColor(Colores.verde)
          .defAuthor({ text: `${toConfirm}, continuando...`, icon: client.EmojisObject.Loading.url });

        await interaction.editReply({ embeds: [confirmation], components: [] });

        return resolve(interaction);
      } else {
        await interaction.editReply({ embeds: [cancelEmbed], components: [] });

        return resolve(false);
      }
    })
  })
}

/**
 * @param {*} user Mongoose User Query with one document
 * @param {Object} data Needed member, rule string, and proof object used for the infraction
 * @param {Boolean} [isSoftwarn=false] The infraction is a softwarn?
 */
const AfterInfraction = async function (user, data) {
  const { member, rule, proof, id, interaction } = data;

  // es un warn normal
  const warns = user.warns;
  const totalWarns = warns.length;

  const guild = member.guild;
  const client = member.client;

  // acciones de automod
  let arrayEmbeds = [];

  let warnedEmbed = new Embed()
    .defAuthor({ text: `Warn`, icon: interaction.client.EmojisObject.Danger.url })
    .defDesc(`
**—** Has sido __warneado__ por el STAFF.
**—** Warns actuales: **${totalWarns}**.
**—** Por infringir la regla: **${rule}**.
**—** **[Pruebas](${proof})**.
**—** ID de Warn: \`${id}\`.`)
    .defColor(Colores.rojo)
    .defFooter({ text: `Ten más cuidado la próxima vez!`, icon: interaction.guild.iconURL({ dynamic: true }) });

  arrayEmbeds.push(warnedEmbed);
  let banMember = false;

  if (totalWarns >= 4) {
    let autoMod = new Embed()
      .defAuthor({ text: `Ban PERMANENTE.`, icon: client.EmojisObject.Ban.url })
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
        .defAuthor({ text: `TempBan`, icon: client.EmojisObject.Kick.url })
        .defDesc(`**—** Ban (24h).
**—** Warns actuales: **${totalWarns}**.
**—** Razón de ban (AutoMod): 3 warns acumulados.
**—** Último warn por infringir la regla: **${rule}**.`)
        .defColor(Colores.rojo);

      arrayEmbeds.push(autoMod);
      banMember = true


      let guildBan = await GlobalDatas.findOne({
        "info.type": "temporalGuildBan",
        "info.userID": member.id,
        "info.guild_id": guild.id
      });

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
    } else

      if (totalWarns >= 2) {
        let infoEmbed = new Embed()
          .defAuthor({ text: `Información`, icon: client.EmojisObject.Danger.url })
          .defDesc(`**—** ${member.user.tag}, este es tu **warn número ❛ \`2\` ❜**
*— ¿Qué impacto tendrá este warn?*
**—** Tranquil@. Este warn no afectará en nada tu estadía en el servidor, sin embargo; el siguiente warn será un **ban de un día**.
**—** Te sugiero comprar un **-1 Warn** en la tienda del servidor. *( \`/shop\` para más info de precios, etc. )*`)
          .defColor(Colores.rojo);

        arrayEmbeds.push(infoEmbed);
      }

  // mensaje de warn normal
  // embed que se le envía al usuario por el warn

  if (banMember) member.ban({ reason: `AutoMod. (Infringir "${rule}")` });

  try {
    await member.send({ embeds: arrayEmbeds })
    return true
  } catch (e) {
    await interaction.editReply({ embeds: [new ErrorEmbed({ type: "notSent", data: { tag: member.user.tag, error: e } })] })
    return false
  }

  /*  else {
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
 * El trabajo de la DarkShop y todo lo que conlleva
 * @param {Client} client 
 */
const ManageDarkShops = async function (client) {
  await client.guilds.fetch()

  for await (const guild of client.guilds.cache.values()) {
    const darkshop = new DarkShop(guild);

    darkshop.inflationWork();
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
    .defFooter({ text: `▸ Vuelve cuando seas nivel ${guild.settings.quantities.darkshop_level}.` });

  if (user.economy.global.level < guild.settings.quantities.darkshop_level) return { valid: false, embed: notReady }
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
 * const id = FindNewId(query, "data.example", "id");
 * const generalid = FindNewId(query, "", "id");
 * ```
 * @returns {Number} Unique ID within the query
 */
const FindNewId = function (generalQuery, specificQuery, toCheck) {
  // id
  let idsNow = []; // ids en uso actualmente
  let newId = 1;

  if(!Array.isArray(generalQuery)) generalQuery = [generalQuery];

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
 * - BoostObjetives
 * - any
 * @returns {Promise<Boolean>} This Member already has a temp role with the objetive searched for.
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
          case BoostObjetives.Currency:
          case BoostObjetives.Exp:
          case BoostObjetives.All:
            if (special.objetive === objetiveToCheck) hasBoost = true;
            break;

          case "any":
            if (special.objetive === BoostObjetives.Currency ||
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

/**
 * 
 * @param {BaseInteraction} interaction 
 * @returns 
 */
const isOnMobible = function (interaction) {
  return interaction.member.presence &&
    interaction.member.presence.clientStatus &&
    interaction.member.presence.clientStatus.mobile === "online" &&
    !interaction.member.presence.clientStatus.desktop ? true : false;
}

/**
 * Revisa si un miembro tiene algún rol con las Ids en el array
 * @param {GuildMember} member 
 * @param {Array} array 
 * @returns {Boolean}
 */
const MemberHasAnyRole = function (member, array) {
  const memberRoles = member.roles.cache;

  let filtered = memberRoles.filter(role => array.includes(role))

  if (filtered.size > 0) return true
  return false
}

/**
 * Revisar que si un miembro tiene alguna de las Ids registradas como Developer
 * @param {GuildMember} member 
 * @returns {Boolean}
 */
const isDeveloper = function (member) {
  return Bases.devIds.find(x => x === member.id) ? true : false;
}

/**
 * 
 * @param {Client} client 
 */
const ActivityWork = async function (client) {
  const activities = await GlobalDatas.getActivities();
  let act;

  if (!activities.info.fixed) {
    act = GetRandomItem(activities.info.list)
  } else {
    act = activities.info.list.find(x => x.id === activities.info.fixed)
  }

  let acttype = act.type?.charAt(0).toUpperCase() + act.type?.slice(1);
  let type = ActivityType[acttype] ?? ActivityType.Playing;
  let activity = act.value.replace("{ USUARIOS }", client.totalMembers);

  return client.user.setPresence({ activities: [{ name: activity, type }], status: client.isOnLockdown ? PresenceUpdateStatus.Idle : PresenceUpdateStatus.Online })
}

const UpdateObj = function (obj, prop, value) {
  if (typeof prop === "string")
    prop = prop.split(".");

  if (prop.length > 1) {
    var e = prop.shift();
    UpdateObj(obj[e] =
      Object.prototype.toString.call(obj[e]) === "[object Object]"
        ? obj[e]
        : {},
      prop,
      value);
  } else
    obj[prop[0]] = value;
}

/**
 * @returns {String} Una barra llena de acuerdo al porcentaje pasado
 * @param {Number} percentage En termino de porcentaje (10, 90, 100, 50, etc)
 * @param {{blocks: Number, emptyChr: String, fullChr: String}} options 
 */
const ProgressBar = function (percentage, options = { max: 100, blocks: 10, emptyChr: "⬜", fullChr: "🟩" }) {
  const empty = options.emptyChr ?? "⬜";
  const full = options.fullChr ?? "🟩";
  const blocks = options.blocks ?? 10;
  const max = options.max ?? 100;

  let fullNum = Math.floor(blocks * percentage / max);
  let emptyNum = Math.floor(blocks - fullNum);

  let fullBlocks = full.repeat(fullNum)
  let emptyBlocks = empty.repeat(emptyNum)

  return fullBlocks + emptyBlocks;
}

/**
 * @param {Client} client 
 */
const UpdateCommands = async function (client) {
  const ClientCommands = new Commands(["./commands/", "./contextmenus/"]);
  return new Promise(async (res, rej) => {
    try {
      let resp = await ClientCommands.prepare(client, ["482989052136652800"])
      res(resp);
    } catch (err) {
      rej(err)
    }
  })
}

/**
 * @param {Message} message 
 * @returns {Promise<Boolean>}
 */
const DeleteLink = async function (message) {
  const Links = [
    "https", "http", "www.", "discord.gg", "discord.gift"
  ];

  const doc = await Guilds.getOrCreate(message.guild.id);
  const member = message.member;
  const link = Links.some(x => message.content.includes(x));

  if (!doc.moduleIsActive("automoderation.remove_links")) return false;
  if (!member.permissions.missing(PermissionsBitField.Flags.EmbedLinks).length > 0) return false;

  if (!link && message.embeds.length < 1) return false;

  message.delete();
  message.author.send({
    embeds: [
      new Embed()
        .defAuthor({ text: `No envíes links`, title: true })
        .defDesc(`Detecté que incluiste un link en tu mensaje:
${codeBlock(message.content)}`)
        .defFooter({ text: `Discúlpame si fue un error :)`, icon: message.guild.iconURL({ dynamic: true }) })
        .defColor(Colores.rojo)
    ]
  })
    .catch(async err => {
      let msg = await message.channel.send(`No envíes links, **${message.author.tag}**.`)

      setTimeout(() => {
        msg.delete();
      })
    });

  try {
    new Log(message)
      .setTarget(ChannelModules.ModerationLogs)
      .setReason(LogReasons.AutoMod)
      .send({
        embeds: [
          new Embed()
            .defAuthor({ text: `Se eliminó un mensaje de ${message.author.tag}`, icon: member.displayAvatarURL({ dynamic: true }) })
            .defDesc(`${codeBlock(message.content)}`)
            .defColor(Colores.verde)
            .defFooter({ text: "NO se aplicaron sanciones", timestamp: true })
        ]
      })
  } catch (err) {
    console.log(err);
  }

  return true;


}

module.exports = {
  GetChangesAndCreateFields,
  FetchAuditLogs,
  GlobalDatasWork,
  ManageDarkShops,
  VaultWork,
  LimitedTime,
  Subscription,
  handleUploads,
  isBannedFrom,
  Confirmation,
  AfterInfraction,
  InteractivePages,
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
  GetRandomItem,
  MemberHasAnyRole,
  isDeveloper,
  ActivityWork,
  UpdateObj,
  ProgressBar,
  UpdateCommands,
  DeleteLink
}
