const { ActivityType, ButtonStyle, OverwriteType, PermissionsBitField, ActionRowBuilder, AttachmentBuilder, ButtonBuilder, Guild, GuildMember, CommandInteraction, BaseInteraction, Message, Client, time, hyperlink, codeBlock, PresenceUpdateStatus, User, MessageFlags } = require("discord.js");

const Colores = require("../resources/colores.json");
const Cumplidos = require("../resources/cumplidos.json");

const ErrorEmbed = require("../utils/ErrorEmbed");
const Embed = require("../utils/Embed");
const InteractivePages = require("../utils/InteractivePages");
const DarkShop = require("../utils/DarkShop");
const Pet = require("../utils/Pet");

const ms = require("ms");
const moment = require("moment-timezone");
const crypto = require("crypto");

/* ##### MONGOOSE ######## */
const { Users, Guilds, DarkShops, Shops, GlobalDatas, CustomElements, Preferences } = require("mongoose").models;

// JEFFREY BOT NOTIFICATIONS
const { google } = require("googleapis");
const { ApiClient } = require("@twurple/api");
const { AppTokenAuthProvider } = require("@twurple/auth");
const { BoostObjetives, ChannelModules, LogReasons, BoostTypes, PetNotices, Enum, DirectMessageType, ToggleableFunctions } = require("./Enums");
const Log = require("./Log");
const { Bases } = require("../resources");
const Commands = require("../app/Commands");
const Collector = require("./Collector");
const HumanMs = require("./HumanMs");
const { Chance } = require("chance");
const { DMNotSentError } = require("../errors");

/* ##### MONGOOSE ######## */

const RandomCumplido = function (force = null) {
  return force ? Cumplidos.c[force] : new Chance().pickone(Cumplidos.c);
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
  if (!guild) return console.log("🔴 No se especificó guild")
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
 * @deprecated
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
  header_icon = header_icon ?? guild.iconURL();

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
    console.log("🔴 No se envió el Log a %s: %s", guild.name, err.name);
  }

}

/**
 * GlobalData work
 * @param {Guild} guild The Guild where the interval shall be executed
 * @param {boolean} [justTempRoles=false] Just execute interval of temporal roles
 * @returns {Promise<void>}
 */
const GlobalDatasWork = async function (guild, justTempRoles = false) {
  const { EmojisObject } = guild.client;
  const doc = await Guilds.getWork(guild.id);
  const customDoc = await CustomElements.getWork(guild.id);

  const bdRole = doc.getRole("birthday") ? await guild.roles.fetch(doc.getRole("birthday")).catch(err => {
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
  let chargedSecuredFee = false;
  //console.log(members.values())
  // buscar roles temporales & cumpleaños
  for await (const member of members.values()) {
    if (member.user.bot) continue

    let dbUser = await Users.getWork({
      user_id: member.id,
      guild_id: guild.id
    });

    let temp_roles = dbUser?.data.temp_roles ?? [];
    let birthday = dbUser?.data.birthday.locked;
    let birthday_reminders = dbUser?.getBirthdayReminders() ?? [];
    let temproledeletions = await GlobalDatas.getTempRoleDeletions(member.id, guild.id) ?? [];
    let debts = dbUser?.data.debts ?? [];

    for await (const temprole of temp_roles) {
      let tempRoleIndex = dbUser.data.temp_roles.findIndex(x => x.id === temprole.id);
      let role = guild.roles.cache.find(x => x.id === temprole.role_id);
      let until = temprole.active_until;

      const Logger = new Log()
        .setGuild(guild)
        .setReason(LogReasons.Error)
        .setTarget(ChannelModules.StaffLogs);

      const removingRoleErr = (err) => new ErrorEmbed().defDesc(`**No se pudo eliminar el role de un temprole**\n${codeBlock("json", err)}`);

      // Ya pasó el tiempo definido
      if (moment().isAfter(until)) {
        // No es una suscripción
        if (!temprole.isSub) {
          console.log("🟢 Ha pasado el tiempo del temprole %s", temprole);

          try {
            if (role) await member.roles.remove(role);
          } catch (err) {
            Logger.send({ embed: removingRoleErr(err) })
          }

          dbUser.data.temp_roles.splice(tempRoleIndex, 1);
        } else { // Es una suscripción, y ya es momento de cobrarle
          let price = temprole.sub_info.price;
          let subName = temprole.sub_info.name;
          let { interval, isCancelled } = temprole.sub_info;

          let notEnough = new ErrorEmbed()
            .defDesc(`**—** No pudiste pagar tu suscripción **${subName}** (${PrettyCurrency(guild, price)}). Se canceló automáticamente.`);

          // Ya fue cancelada, eliminar el temprole
          if (isCancelled) {
            try {
              if (role) await member.roles.remove(role);
            } catch (err) {
              Logger.send({ embed: removingRoleErr(err) })
            }

            dbUser.data.temp_roles.splice(tempRoleIndex, 1);
          } else {
            // Como aún está activa, cobrar la sub
            let newTotal = dbUser.getCurrency() - price;

            if (!dbUser.affords(price)) {
              try {
                await SendDirect(null, member, DirectMessageType.Payments, { embeds: [notEnough] });
              } catch (err) {
                console.error("🔴 %s", err.stack);
              }

              try {
                if (role) await member.roles.remove(role);
              } catch (err) {
                Logger.send({ embed: removingRoleErr(err) })
              }

              dbUser.data.temp_roles.splice(tempRoleIndex, 1);
            } else {
              temprole.active_until = moment().add(interval, "ms").startOf("minute").toDate();
              dbUser.markModified("data.temp_roles");
              try {
                await SendDirect(null, member, DirectMessageType.Payments, {
                  embeds: [
                    new Embed({
                      type: "success",
                      data: {
                        title: "Pagado",
                        desc: [
                          `Se han restado ${PrettyCurrency(guild, price)} para pagar la suscripción a **${subName}**`,
                          `Ahora tienes ${PrettyCurrency(guild, newTotal)}`,
                          `Administra tus suscripciones usando ${guild.client.mentionCommand("subs")} en un servidor`
                        ]
                      }
                    })
                  ]
                }, true)
              } catch (err) {
                console.error("🔴 %s", err.stack);
              }

              await dbUser.addCount("subscriptions_currency", price, false);
            }

            await dbUser.removeCurrency(price);

          }
        }
      }
    }

    try {
      if (justTempRoles) return await dbUser.save();
    } catch (err) {
      console.error("🔴 Error guardando en GlobalDatas siendo solo temproles", err);
    }

    // Actualizar lista de Trofeos
    let trophyList = customDoc.trophies;
    if (trophyList.length > 0) {
      const CustomTrophy = require("./CustomTrophy");

      for await (const trophy of trophyList) {
        if (!trophy.enabled) continue;

        try {
          dbUser = await new CustomTrophy(guild).manage(trophy.id, member, dbUser, customDoc, false)
          //console.log(dbUser.data.temp_roles);
        } catch (err) {
          console.error("🔴 %s", err);
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
        }

        deletion.deleteOne();
      }
    }

    for (const reminder_info of birthday_reminders) {
      const reminder = reminder_info.id
      const birthday_member = guild.members.cache.get(reminder);
      let birthday_query = await Users.getWork({ user_id: reminder, guild_id: guild.id });
      if (birthday_query?.isBirthday() && !reminder_info.reminded) {
        try {
          await SendDirect(null, member, DirectMessageType.Birthdays, {
            embeds: [
              new Embed()
                .defAuthor({ text: `Hola`, icon: EmojisObject.Hola.url })
                .defDesc(`¡Vengo a recordarte que ${birthday_member} está de cumpleaños hoy!`)
                .defFooter({
                  text: `Recibiste este mensaje porque quisiste que te lo recordara, para dejar de recibir esto usa /stats usuario:@${birthday_member.displayName} y presiona el botón de recordatorios`,
                  icon: guild.iconURL(),
                  timestamp: true
                })
                .defColor(Colores.verdeclaro)
            ]
          })
        } catch (err) {
          console.log("⚠️ No se pudo enviar el recordatorio a %s", member.user.username)
          console.log("⚠️ Se eliminará el recordatorio")

          dbUser.data.birthday_reminders.splice(dbUser.getBirthdayReminders().findIndex(x => x === reminder), 1)
        }

        reminder_info.reminded = true;
      } else if (!birthday_query?.isBirthday() && reminder_info.reminded) {
        reminder_info.reminded = false;
      }
    }

    for await (const debt of debts) {
      if (moment().isAfter(debt.pay_in)) {
        // cobrar intereses y actualizar la fecha
        let topay = Math.round(debt.debt * (debt.interest / 100));
        let memberToPay = guild.members.cache.get(debt.user);
        debt.pay_in = moment().add(debt.every, "ms").startOf("minute");
        await dbUser.removeCurrency(topay);

        let userToPay = await Users.getWork({ user_id: memberToPay.id, guild_id: guild.id });
        await userToPay.addCurrency(topay);

        try {
          await SendDirect(null, member, DirectMessageType.Payments, {
            embeds: [
              new Embed()
                .defColor(Colores.verde)
                .defTitle(`Intereses del ${debt.interest}% cada ${new HumanMs(debt.every).human}`)
                .defDesc(`**—** Se te cobró ${PrettyCurrency(guild, topay)} por el préstamo que tienes pendiente con ${memberToPay}.
**—** Usa \`/pay\` para pagarle los ${PrettyCurrency(guild, debt.debt)} que le debes.`)
            ]
          })
        } catch (err) {
          console.error("🔴 %s", err);
        }

        try {
          await SendDirect(null, memberToPay, DirectMessageType.Incomes, {
            embeds: [
              new Embed()
                .defColor(Colores.verde)
                .defTitle(`Intereses del ${debt.interest}% cada ${new HumanMs(debt.every).human}`)
                .defDesc(`**—** Se depositaron ${PrettyCurrency(guild, topay)} por el préstamo que tienes con ${member}.
**—** Aún te debe ${PrettyCurrency(guild, debt.debt)}.`)
            ]
          })
        } catch (err) {
          console.error("🔴 %s", err);
        }

      }
    }

    // Dinero protegido
    const lastPaidSecured = moment(doc.data.last_interests.secured);
    if (moment().isAfter(lastPaidSecured.add(doc.settings.quantities.interest_days.secured, "days"))) {
      chargedSecuredFee = true;

      if (dbUser.getSecured() > 0) {
        const securedFee = Math.round(dbUser.getSecured() * doc.settings.quantities.percentages.interests.secured / 100);

        if (securedFee > 0) {
          console.log("Pasó el tiempo suficiente para cobrar intereses");
          console.log(member.user.username);
          console.log(securedFee);

          dbUser.removeSecured(securedFee);
          doc.addToBank(securedFee, false);

          try {
            await SendDirect(null, member, DirectMessageType.Payments, {
              embeds: [
                new Embed()
                  .defColor(Colores.verde)
                  .defTitle(`Intereses del ${doc.settings.quantities.percentages.interests.secured}% cada ${doc.settings.quantities.interest_days.secured} días`)
                  .defDesc(`**—** Se te cobró __${PrettyCurrency(guild, securedFee)}__ por tener ${PrettyCurrency(guild, dbUser.getSecured())} protegidos.
**—** Usa \`/with\` para sacar tu dinero protegido.`)
              ]
            })
          } catch (err) {
            console.error("🔴 %s", err);
          }
        }
      }
    }

    try {
      //console.log("$", dbUser.data.temp_roles);
      await dbUser.save()
    } catch (err) {
      console.error("🔴 %s", err)
    }

  }

  // Si se pagaron los intereses de dinero protegido
  if (chargedSecuredFee) doc.data.last_interests.secured = new Date();

  // buscar items deshabilitados temporalmente
  Shops.getWork(guild.id).then((shop) => {
    for (const item of shop.items) {
      if (moment().isAfter(item.disabled_until)) {
        item.disabled = false;
        item.disabled_until = null;
      }
    }

    shop.save();
  })

  DarkShops.getWork(guild.id).then((shop) => {
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
    type: "temporalGuildBan",
    "info.guild_id": guild.id
  });

  if (tempBans) {
    for await (const ban of tempBans) {
      let userID = ban.info.userID;
      let since = ban.info.since;
      let realDuration = ban.info.duration;
      let today = new Date();

      if (today - since >= realDuration) {
        // ya pasó el tiempo, unban
        try {
          await guild.members.unban(userID);
          console.log("🟢 Se ha desbaneado a %s", userID)
        } catch (err) {
          console.error("🔴 %s", err);
        }

        await ban.deleteOne();

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
          console.error("🔴 %s", err);
        }
      }
    }
  }

  // buscar encuestas
  let polls = await GlobalDatas.find({ type: "temporalPoll", "info.guild_id": guild.id });
  let pollsIndex = 0;

  staffPolls:
  for await (const poll of polls) {
    const pollInfo = poll.info;

    if (moment().isAfter(pollInfo.until)) {
      let c = guild.channels.cache.find(x => x.id === pollInfo.channel_id);
      if (!c) {
        await poll.deleteOne();
        continue staffPolls;
      }

      let msg = await c.messages.fetch(pollInfo.message_id).catch(err => {
        console.error("🔴 %s", err);
      });

      if (msg?.size > 1 || !msg) {
        await poll.deleteOne();
        continue staffPolls;
      }

      const { yes, no } = pollInfo;

      let textEmbed = new Embed()
        .defColor(Colores.verdeclaro)
        .defAuthor({ text: "La encuesta del STAFF terminó:", title: true })
        .defDesc(pollInfo.poll + `\n\n**LOS USUARIOS DICEN:**`)
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

      try {
        await msg.edit({ components: [row] });
      } catch (err) {
        console.error("🔴 %s", err);
      }

      await poll.deleteOne();
    }

    pollsIndex++;
  }

  // buscar apuestas
  let betsIndex = 0;
  staffBets:
  for await (const bet of doc.data.bets) {
    if (moment().isAfter(bet.closes_in) && !bet.closed) {
      const ch = guild.channels.cache.get(bet.channel_id);
      if (!ch) {
        doc.data.bets.splice(betsIndex, 1);
        continue staffBets;
      }

      const message = await ch.messages.fetch(bet.message_id);

      if (message.size > 1) {
        doc.data.bets.splice(betsIndex, 1);
        continue staffBets;
      }
      const embed = new Embed(message.embeds[0]);
      embed.defDesc(`# ${bet.title}\n**Esperando la respuesta del STAFF...**`);

      const fields = [];
      const elements = [];
      const betInfo = new Map();
      let total = 0;

      const newRow = new ActionRowBuilder();

      bet.options.forEach((option, i) => {
        total += option.betting.length;

        betInfo.set(i, {
          title: `${option.emoji} ${option.name} (1:${option.ratio.toLocaleString("es-CO")})`,
          emoji: option.emoji,
          square: option.square,
          betting: option.betting
        })

        newRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`betWinner-${i}`)
            .setLabel(option.name)
            .setEmoji(option.emoji)
            .setStyle(ButtonStyle.Secondary)
        )
      })

      betInfo.forEach((value) => {
        elements.push({
          percentage: value.betting.length / total * 100,
          square: value.square
        });

        fields.push({
          up: value.title,
          down: `Usuarios: ${String(value.betting.length)} (${PrettyCurrency(guild, value.betting.map(x => x.quantity).reduce((prev, cur) => prev + cur, 0))})`
        })
      })

      embed.data.description += "\n## " + MultiplePercentages(elements, 10);;
      embed.defFields(fields)

      await message.edit({
        embeds: [embed], components: [
          newRow,
          new ActionRowBuilder()
            .setComponents(
              new ButtonBuilder()
                .setCustomId("betCancel")
                .setLabel("Cancelar")
                .setStyle(ButtonStyle.Danger)
            )
        ]
      })
      bet.closed = true;
    }

    betsIndex++;
  }

  // buscar tickets sin respuesta
  ticketReminder:
  for (const ticket of doc.data.tickets) {
    if (!doc.moduleIsActive("functions.staff_reminders")) break ticketReminder;
    if (ticket.end_date) continue;

    let lastReminded = ticket.last_reminded ? moment(ticket.last_reminded) : moment(ticket.creation_date);
    let dayDiff = moment().diff(lastReminded, "d");

    if (dayDiff >= doc.settings.functions.staff_reminders.tickets) { // si la dif se cumple con la config, recordar
      let embed = new Embed()
        .defAuthor({ text: "Recordatorio de Ticket", icon: guild.iconURL() })
        .defDesc(`Hay un Ticket que no se ha cerrado por más de ${doc.settings.functions.staff_reminders.tickets} días (${dayDiff}d).`)
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

    let lastReminded = suggestion.last_reminded ? moment(suggestion.last_reminded) : moment(suggestion.creation_date);
    let dayDiff = moment().diff(lastReminded, "d");
    let channel = await guild.channels.fetch(suggestion.channel_id);
    let message = await channel.messages.fetch(suggestion.message_id);

    if (dayDiff >= doc.settings.functions.staff_reminders.suggestions) { // si la dif se cumple con la config, recordar
      let embed = new Embed()
        .defAuthor({ text: "Recordatorio de sugerencia", icon: guild.iconURL() })
        .defDesc(`Hay una sugerencia que no ha sido respondida por más de ${doc.settings.functions.staff_reminders.suggestions} días (${dayDiff}d).`)
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

  betReminder:
  for (const bet of doc.data.bets) {
    if (!doc.moduleIsActive("functions.staff_reminders")) break betReminder;
    if (!bet.closed) continue;

    let lastReminded = bet.last_reminded ? moment(bet.last_reminded) : moment(bet.closes_in);
    let dayDiff = moment().diff(lastReminded, "d");
    let channel = await guild.channels.fetch(bet.channel_id);
    let message = await channel.messages.fetch(bet.message_id);

    if (dayDiff >= doc.settings.functions.staff_reminders.bets) { // si la dif se cumple con la config, recordar
      let embed = new Embed()
        .defAuthor({ text: "Recordatorio de Apuesta", icon: guild.iconURL() })
        .defDesc(`Hay una Apuesta que no ha tenido resultado por más de ${doc.settings.functions.staff_reminders.bets} días (${dayDiff}d).`)
        .defField(`${bet.title}`, `**—** ${hyperlink("Mensaje de Apuesta", message.url)}, desde el ${time(bet.closes_in)}`)
        .defColor(Colores.verde)

      await new Log()
        .setTarget(ChannelModules.StaffLogs)
        .setReason(LogReasons.Logger)
        .setGuild(guild)
        .send({ content: `${staffRoles.toJSON().join(", ")}`, embed })

      bet.last_reminded = new Date();
    }
  }

  await doc.save();
  return;
}

/**
 * 
 * @param {Guild} guild 
 * @return {Promise<void>}
 */
const PetWork = async function (guild) {
  const doc = await Guilds.getWork(guild.id);
  const members = guild.members.cache;

  for await (const member of members.values()) {
    const user = await Users.getWork({ user_id: member.id, guild_id: guild.id });
    const pets = user.data.pets;
    if (pets.length === 0) continue

    // Bajar las stats de hunger a cada mascota
    for await (const p of pets) {
      const pet = await new Pet(null, p.id).setMember(member).build(doc, user)
      const maxHp = pet.shop_info.stats.hp;
      const maxHungerGiven = doc.settings.quantities.limits.pets.hunger.max;
      const minHungerGiven = doc.settings.quantities.limits.pets.hunger.min;

      const giveHunger = MinMaxInt(minHungerGiven, maxHungerGiven, { guild, msg: "No se ha podido agregar hambre a las mascotas" });
      pet.changeHunger(giveHunger);

      // ----------- Hunger ----------- 
      if (pet.hunger >= 60) await pet.notice(PetNotices.Hungry);

      if (pet.hunger === 100) {
        let removal = new Chance().integer({ min: 1, max: Math.ceil(maxHp * 0.05) });
        pet.changeHp(-removal);
      }

      // ----------- HP ----------- 
      if (pet.hp <= maxHp / 2) await pet.notice(PetNotices.HalfHp)
      else if (pet.hp <= maxHp / 4) await pet.notice(PetNotices.LowHp)

      if (pet.hp === 0) {
        pet.kill();
        await pet.notice(PetNotices.Dead)
      }

      await pet.save();
    }
  }
}

/**
 * Adds a temporary role into the database ands adds the role to the user.
 * @param {GuildMember} victimMember - The Discord.JS Member
 * @param {string} roleID - The ID of the temporary role
 * @param {(number | string)} duration The duration of the temporary role in ms.
 * @param {any} activation_info La del item de la tienda
 * @param {Number} [specialType=false] The special type of this temporary role.
 * @param {Number} [specialObjective=false] The objetive for this special type of temporary role.
 * @param {number} [specialValue=false] The value for the objetive of this special temporary role.
 * @returns Mongoose User document
 */
const LimitedTime = async function (victimMember, roleID = 0, duration, activation_info, specialType = null, specialObjective = null, specialValue = null) {
  let role = victimMember.guild.roles.cache.find(x => x.id === roleID);
  let user = await Users.getWork({ user_id: victimMember.id, guild_id: victimMember.guild.id });

  let active_until = moment().add(duration === Infinity ? ms("999y") : duration, "ms").startOf("minute").toDate();

  let toPush = {
    role_id: roleID,
    active_until,
    activation_info,
    special: {
      type: specialType,
      objetive: specialObjective,
      value: specialValue
    },
    id: FindNewId(await Users.find({ guild_id: victimMember.guild.id }), "data.temp_roles", "id")
  }

  try {
    if (role) await victimMember.roles.add(role);
  } catch (err) {
    console.error("🔴 %s", err);
  }

  user.data.temp_roles.push(toPush);
  await user.save();

  // timeout, por si pasa el tiempo antes de que el bot pueda reiniciarse
  TimeoutIf(duration, async function () {
    try {
      if (role) await victimMember.roles.remove(role);

      // Re-fetch user
      let u = await Users.getWork({ user_id: victimMember.id, guild_id: victimMember.guild.id });
      u.data.temp_roles.splice(u.data.temp_roles.findIndex(x => x.id === toPush.id), 1);
      await u.save();
    } catch (err) {
      console.error("🔴 %s", err);
    }

  })

  return user
}

/**
 * Se ejecuta un timeout si es posible
 * @param {Number} time En MS
 * @param {Function} func 
 */
const TimeoutIf = function (time, func) {
  if (time > 2147483647) return;
  setTimeout(func, time);
}

/**
 * Adds a new subscription to the database and adds the role to the user.
 * @param {GuildMember} member 
 * @param {string} roleID - The ID of the temporary role
 * @param {any} tempInfo La información de temprole necesaria
 * @param {any} activation_info La del item de la tienda
 * @param {Number} interval El intervalo de cada cuanto va a pagar (ms)
 * @param {Number} price Lo que va a pagar cada vez
 * @param {string} subscriptionName El nombre de la suscripción 
 */
const Subscription = async function (member, roleID = 0, tempInfo, activation_info, interval, price, subscriptionName) {
  let role = member.guild.roles.cache.get(roleID);
  let user = await Users.getWork({ user_id: member.id, guild_id: member.guild.id });
  let active_until = moment().add(interval, ms).startOf("minute").toDate();

  let toPush = {
    role_id: role?.id,
    active_until,
    isSub: true,
    activation_info,
    special: {
      ...tempInfo
    },
    sub_info: {
      price,
      name: subscriptionName,
      interval,
      isCancelled: false
    },
    id: FindNewId(await Users.find({ guild_id: member.guild.id }), "data.temp_roles", "id")
  }
  try {
    if (role) await member.roles.add(role);
    user.data.temp_roles.push(toPush);

    await user.save();
  } catch (err) {
    console.log("🔴 No se pudo agregar la sub", err);
  }

  return user
}

const VaultWork = async function (vault, user, interaction, notCodeEmbed) { // mostrar y buscar un codigo no descifrado aún por el usuario
  if (user.data.unlockedVaults.length === vault.length) return await interaction.editReply({ embeds: [notCodeEmbed.defFooter({ text: "Tienes todos los códigos en tus manos, impresionante..." })] })

  const unlocked = user.data.unlockedVaults;

  let code = new Chance().pickone(vault);


  while (unlocked.find(x => x === code.id)) {
    code = new Chance().pickone(vault);
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

  return await interactive.init(interaction);
}

/**
 * 
 * @param {Guild} guild 
 */
const handleNotification = async function (guild) {
  if (guild.id != Bases.owner.guildId && guild.id != Bases.dev.guild) return;
  const doc = await Guilds.getWork(guild.id);

  const youtubeChannel = guild.channels.cache.get(doc.getChannel("notifier.youtube_notif"));
  const twitchChannel = guild.channels.cache.get(doc.getChannel("notifier.twitch_notif"));

  const ytRole = guild.roles.cache.get(doc.getRole("announcements.youtube.videos")) ?? "¡Gente!";
  const shortsRole = guild.roles.cache.get(doc.getRole("announcements.youtube.shorts")) ?? "¡Gente!";
  const twitchRole = guild.roles.cache.get(doc.getRole("announcements.twitch")) ?? "¡Gente!";

  let dataNotified = doc.data.social_notifications;

  const config = {
    youtube_channelId: doc.settings.notifications.youtube,
    twitch_username: doc.settings.notifications.twitch
  }

  const textos = {
    videos: ["Ha llegado el momento, chécalo para evitar que Jeffrey se ponga triste.", "Dale like o comenta algo si te gustó lo suficiente :D", "Espero que nos veamos en la próxima, ¡y que no sea en ██ meses!", "Hazme caso, está bueno. Míralo, a lo bien.", "No sabría decir si es lamentable, espero que no, ¿por qué no lo ves para comprobarlo y me dices qué tal?"],
    shorts: ["Venga va, que es de los cortos chécalo.", "¡Viva el contenido rápido!", "¿Sólo unos días más para que salga un video real?", "¡Otro video corto para hacer presencia!"],
    twitch: ["¡Ven y di hola!", "¡Ven y saluda!", "¡Pásate!", "¡Esto no pasa todo el tiempo, ven!", "¿QUÉ? LLEGA"],
    emojis: ["⚡", "🔥", "✨", "💚", "🦊", guild.client.Emojis.Badge, "👀", guild.client.Emojis.POG],
    labels: ["¡Me interesa!", "¡Veamos!", "¡Interesante!", "¡Click!", "¡Me sirve!", "¡A ver!"]
  }

  // YouTube
  if (config.youtube_channelId) {
    const googleRes = await google.youtube("v3").activities.list({
      key: process.env.YOUTUBE_TOKEN,
      part: "snippet, contentDetails",
      channelId: config.youtube_channelId
    })

    for (const item of googleRes.data.items) {
      if (item.snippet.type != "upload") continue;

      const videoId = item.contentDetails.upload.videoId;
      const publishDate = moment(item.snippet.publishedAt)

      // Si ya fue notificado ignorar
      if (dataNotified.youtube.shorts.find(x => x === videoId) || dataNotified.youtube.videos.find(x => x === videoId)) {
        // console.log("🟢 Ignoring %s: Already notified", videoId);
        continue;
      }

      const videoLink = `https://www.youtube.com/watch?v=${videoId}`;
      const shortLink = `https://www.youtube.com/shorts/${videoId}`;

      let isShort, shortRes;
      try {
        shortRes = await fetch(shortLink, { redirect: "manual" });
        if (shortRes.status === 404) throw Error(`404 Checking if short: ${shortLink}`)
        isShort = shortRes.status === 303 ? false : true;
      } catch (err) {
        console.error("🔴 Error checking short: %s", err);
        continue;
      }

      // Si ya pasó mucho tiempo, ignorar
      const timePassed = moment().diff(publishDate, "days");
      if (timePassed > doc.settings.quantities.ignore_notifications[isShort ? "youtube_shorts" : "youtube_videos"]) {
        // console.log("🟢 Ya pasó mucho tiempo para notificar (%sd): %s", timePassed, item.snippet.title);
        continue;
      }

      let prop = isShort ? "shorts" : "videos";

      let embed = new Embed()
        .defDesc(`# ${isShort ? "¡NUEVO SHORT!" : "¡NUEVO VIDEO!"}\n### ${new Chance().pickone(textos.emojis)} ${item.snippet.title}`)
        .defColor(Colores.verde)
        .defFooter({ text: `— ${new Chance().pickone(textos[prop])}` })
        .defImage(item.snippet.thumbnails.maxres.url ?? item.snippet.thumbnails.default.url);

      let components = [
        new ActionRowBuilder()
          .setComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setURL(isShort ? shortLink : videoLink)
              .setEmoji(isShort ? guild.client.Emojis.YouTubeShorts : guild.client.Emojis.YouTube)
              .setLabel(new Chance().pickone(textos.labels))
          )
      ]

      // Hay canal de anuncios de YouTube configurado
      if (youtubeChannel) {
        dataNotified.youtube[prop].push(videoId);
        await doc.save();

        await youtubeChannel.send({ content: (isShort ? shortsRole : ytRole).toString(), embeds: [embed], components });

        console.log("🟢 Announced %s", videoId)
        console.log("🟢 ShortRes: %s", shortRes);
        console.log("🟢 IsShort: %s", isShort);
      }
    }
  }

  // Twitch
  const authProvider = new AppTokenAuthProvider(process.env.TWITCH_CLIENT, process.env.TWITCH_SECRET);
  const apiClient = new ApiClient({ authProvider });

  if (config.twitch_username) {
    const streamLink = `https://twitch.tv/${config.twitch_username}`;
    let streaming = await isStreaming(config.twitch_username);

    // Si está en directo, y hay canal de anuncios de Twitch configurado
    if (streaming && twitchChannel) {
      const stream = await getStream(config.twitch_username);
      const streamId = stream.id;
      const streamTitle = stream.title;
      if (!dataNotified.twitch.find(x => x === streamId)) {
        let embed = new Embed()
          .defDesc(`# ¡JEFFREY ESTÁ EN DIRECTO!\n### ${new Chance().pickone(textos.emojis)} ${streamTitle}`)
          .defColor("#9146FF")
          .defFooter({ text: `— ${new Chance().pickone(textos.twitch)}` })
          .defImage(await getUserPicture(config.twitch_username));

        let components = [
          new ActionRowBuilder()
            .setComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(streamLink)
                .setEmoji(guild.client.Emojis.Twitch)
                .setLabel(new Chance().pickone(textos.labels))
            )
        ]

        dataNotified.twitch.push(streamId);
        await doc.save();

        await twitchChannel.send({ content: twitchRole.toString(), embeds: [embed], components });
        console.log("🟢 Announced Twitch stream")
      }
    }
  }

  async function isStreaming(username) {
    try {
      const user = await apiClient.users.getUserByName(username);

      if (!user) return false;
      return await user.getStream() !== null;
    } catch (err) {
      console.error("🔴 %s", err);
    }
  }

  async function getStream(username) {
    const user = await apiClient.users.getUserByName(username);

    if (!user) return null;

    const stream = await user.getStream()

    if (!stream) return null;

    return stream;
  }

  async function getUserPicture(username) {
    const user = await apiClient.users.getUserByName(username);
    if (!user) return null

    return user.profilePictureUrl;
  }

}

/**
 * 
 * @param {String} toConfirm Lo que se está confirmando
 * @param {Array} dataToConfirm El texto que aparece separado por "▸"
 * @param {CommandInteraction} interaction La interacción que ejecuta esta confirmación
 * @param {User} user El usuario que usará esta confirmación
 * @returns {Promise<BaseInteraction | false>} Discord.JS Message if the confirmation is positive, if not, returns false
 */
const Confirmation = async function (toConfirm, dataToConfirm, interaction, user = interaction.user) {
  const client = interaction.client;

  let DescriptionString = "";
  let egEmbed = null;
  let egButton = null;

  dataToConfirm.forEach(data => {
    if (data instanceof Embed) {
      egEmbed = data;
    } else if (data instanceof ButtonBuilder) {
      egButton = data;
    } else
      DescriptionString += `\`▸\` ${data}\n`;
  });

  let confirmation = new Embed()
    .defAuthor({ text: `¿${toConfirm}?`, icon: interaction.guild.iconURL() })
    .defDesc(DescriptionString)
    .defColor(Colores.rojo);

  let embeds = [confirmation];
  if (egEmbed) embeds.push(egEmbed);

  let cancelEmbed = new Embed({
    type: "cancel"
  })

  // componentes
  let components = [];
  if (egButton) {
    components.push(
      new ActionRowBuilder()
        .addComponents(
          egButton
        )
    )
  }

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

  components.push(row)

  // enviar mensaje de confirmación
  let msg = await interaction.editReply({ embeds, components });
  if (!msg) return null;

  return new Promise(async (resolve, reject) => {
    const filter = async i => {
      return i.user.id === user.id &&
        (i.customId === "confirmAction" || i.customId === "cancelAction") &&
        i.message.id === msg.id;
    }

    const collector = new Collector(interaction, { filter, max: 1 }).onEnd((collected, reason) => {
      if (collected.size === 0) {
        interaction.editReply({ embeds: [cancelEmbed], components: [] })
        resolve(false)
      }
    }).raw();

    collector.on("collect", async i => {
      if (i.customId === "confirmAction") {
        confirmation
          .defColor(Colores.verde)
          .defAuthor({ text: `${toConfirm}, continuando...`, icon: client.EmojisObject.Loading.url });

        await interaction.editReply({ embeds: [confirmation], components: [] });

        resolve(interaction);
      } else {
        await interaction.editReply({ content: null, embeds: [cancelEmbed], components: [] });

        resolve(false);
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
    .defFooter({ text: `Ten más cuidado la próxima vez!`, icon: interaction.guild.iconURL() });

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
        type: "temporalGuildBan",
        "info.guild_id": guild.id
      });

      let now = new Date();

      if (!guildBan) {
        const newBan = new GlobalDatas({
          type: "temporalGuildBan",
          info: {
            user_id: member.id,
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
          .defDesc(`**—** ${member.displayName}, este es tu **warn número ❛ \`2\` ❜**
*— ¿Qué impacto tendrá este warn?*
**—** Tranquil@. Este warn no afectará en nada tu estadía en el servidor, sin embargo; el siguiente warn será un **ban de un día**.
**—** Te sugiero comprar un **-1 Warn** en la tienda del servidor. *( \`/shop\` para más info de precios, etc. )*`)
          .defColor(Colores.rojo);

        arrayEmbeds.push(infoEmbed);
      }

  // mensaje de warn normal
  // embed que se le envía al usuario por el warn

  if (banMember) {
    try {
      await member.ban({ reason: `AutoMod. (Infringir "${rule}")` });
    } catch (err) {
      console.error("🔴 %s", err);
    }
  }

  try {
    await SendDirect(null, member, DirectMessageType.Moderation, {
      embeds: arrayEmbeds
    })
    return true;
  } catch (e) {
    return e;
  }
}

/**
 * El trabajo de la DarkShop y todo lo que conlleva
 * @param {Client} client 
 */
const ManageDarkShops = async function (client) {
  await client.guilds.fetch()

  for await (const guild of client.guilds.cache.values()) {
    const darkshop = new DarkShop(guild);

    await darkshop.inflationWork();
  }
}

/**
 * 
 * @param {*} user The mongoose User
 * @param {*} author The Discord.JS User
 * @returns 
 */
const ValidateDarkShop = async function (user, author) {
  let guild = await Guilds.getWork(user.guild_id);

  const r = [
    "{you}... No estás listo.",
    "No tienes el valor para hacerlo.",
    "Esto no va a terminar bien para ti, {you}.",
    "No eres digno.",
    "Olvídalo, {you}.",
    "Aún no, {you}."
  ];

  let res = new Chance().pickone(r);

  const desc = res.replace(
    new RegExp("{you}", "g"),
    `**${author.username}**`
  );

  const notReady = new Embed()
    .defColor(Colores.rojo)
    .defDesc(desc)
    .defFooter({ text: `▸ Vuelve cuando seas nivel ${guild.settings.quantities.darkshop.level}.` });

  if (user.economy.global.level < guild.settings.quantities.darkshop.level) return { valid: false, embed: notReady }
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
 * Balance de precios para todos los usuarios
 * @param {Guild} guild 
 */
const FindAverage = async function (guild) {
  //const doc_guild = await Guilds.getWork(guild.id);
  const users = await Users.find({ guild_id: guild.id });
  const darkshop = new DarkShop(guild);
  const disabled = await darkshop.checkDisabled();

  let patrimonios = [];

  for await (const user of users) {
    // agregar la cantidad de darkcurrency
    const member = guild.members.cache.get(user.user_id);

    if (member && !member.user.bot) {
      let darkcurrency = user.getDarkCurrency();
      let darkcurrencyValue = 0;

      if (!disabled) darkcurrencyValue = await darkshop.equals(null, darkcurrency) ?? 0;

      // Sumar Jeffros invertidos, usables, y protegidos
      let finalQuantity = Math.round(darkcurrencyValue + user.getAllMoney());

      if (finalQuantity > 0 || (finalQuantity === 0 && !patrimonios.find(x => x === 0))) patrimonios.push(finalQuantity);
    }
  }

  let sum = patrimonios.reduce((acc, patrimonio) => acc + patrimonio, 0);
  return sum / patrimonios.length;
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
const FindNewId = function (generalQuery, specificQuery, toCheck = 'id') {
  let idsNow = new Set(); // ids en uso actualmente

  if (!Array.isArray(generalQuery)) generalQuery = [generalQuery];

  for (const document of generalQuery) {
    let property = specificQuery.length > 0 ? document.get(specificQuery) : document;

    if (Array.isArray(property)) {
      property.forEach(item => idsNow.add(item[toCheck]))
    } else {
      idsNow.add(property[toCheck])
    }
  }

  let newId = 1;
  while (idsNow.has(newId)) { // mientras se encuentre la id en las que ya están en uso sumar una hasta que ya no lo esté
    newId++;
  }

  return newId;
}

/**
 * 
 * @param {*} generalQuery Mongoose documents
 * @param {String} specificQuery The data inside that document 
 * @param {String} toCheck The parameter to check inside the specific query
 * @param {Number} quantity Number of Ids to return
 * @example
 * ```javascript
 * let query = await Model.find();
 * const availableIds = FindNewIds(query, "data.example", "id", 5);
 * const generalAvailableIds = FindNewIds(query, "", "id", 5);
 * ```
 * @returns {[Number]} Unique ID within the query
 */
const FindNewIds = function (generalQuery, specificQuery, toCheck, quantity) {
  let returnable = [];
  let idsNow = new Set(); // ids en uso actualmente

  if (!Array.isArray(generalQuery)) generalQuery = [generalQuery];

  for (const document of generalQuery) {
    let property = specificQuery.length > 0 ? document.get(specificQuery) : document;

    if (Array.isArray(property)) {
      property.forEach(item => idsNow.add(item[toCheck]))
    } else {
      idsNow.add(property[toCheck])
    }
  }

  let newId = 1;
  for (let i = 1; i <= quantity; i++) {
    while (idsNow.has(newId)) {
      newId++;
    }

    idsNow.add(newId);
    returnable.push(newId);
  }

  return returnable;
}

/**
 * 
 * @param {GuildMember} member The Discord.JS Member to check for benefit
 * @param {Array} [objetivesToCheck] The objetive of boost to check.
 * - BoostObjetives
 * - any
 * @returns {Promise<Boolean>} This Member already has a temp role with the objetive searched for.
 */
const WillBenefit = async function (member, objetivesToCheck) {
  objetivesToCheck = objetivesToCheck ?? [BoostObjetives.Currency, BoostObjetives.Exp, BoostObjetives.All];

  const user = await Users.getWork({
    user_id: member.id,
    guild_id: member.guild.id
  });

  const boostInfo = BoostWork(user);
  const temp_roles = user.data.temp_roles;

  let hasBoost = false;

  temp_roles.forEach(temprole => {
    const special = temprole.special;
    if (special) {
      objetivesToCheck.forEach(objetiveToCheck => {
        switch (objetiveToCheck) {
          case BoostObjetives.Currency:
            if (boostInfo.multiplier.changed.currency && boostInfo.multiplier.currency_value > 1) hasBoost = true;
            if (boostInfo.probability.changed.currency && boostInfo.probability.currency_value > 1) hasBoost = true;
            break;
          case BoostObjetives.Exp:
            if (boostInfo.multiplier.changed.exp && boostInfo.multiplier.exp_value > 1) hasBoost = true;
            if (boostInfo.probability.changed.exp && boostInfo.probability.exp_value > 1) hasBoost = true;
            break;
          case BoostObjetives.All:
            if (boostInfo.multiplier.changed.currency && boostInfo.multiplier.currency_value > 1) hasBoost = true;
            if (boostInfo.probability.changed.currency && boostInfo.probability.currency_value > 1) hasBoost = true;
            if (boostInfo.multiplier.changed.exp && boostInfo.multiplier.exp_value > 1) hasBoost = true;
            if (boostInfo.probability.changed.exp && boostInfo.probability.exp_value > 1) hasBoost = true;
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
    act = new Chance().pickone(activities.info.list)
  } else {
    act = activities.info.list.find(x => x.id === activities.info.fixed)
  }

  if (!act) return;

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
  if (!percentage || isNaN(percentage)) percentage = 0;
  const empty = options.emptyChr ?? "⬜";
  const full = options.fullChr ?? "🟩";
  const blocks = options.blocks ?? 10;
  const max = options.max ?? 100;

  let fullNum = Math.floor(blocks * percentage / max);
  if (fullNum < 0) fullNum = 0;

  let emptyNum = Math.floor(blocks - fullNum);
  if (emptyNum < 0) emptyNum = 0;

  if (fullNum > blocks) fullNum = blocks;
  if (emptyNum > blocks) emptyNum = blocks;

  let fullBlocks = full.repeat(fullNum)
  let emptyBlocks = empty.repeat(emptyNum)

  return fullBlocks + emptyBlocks;
}

const MultiplePercentages = function (elements = [{ percentage, square }], blocks = 10) {
  let prog = "";

  elements.forEach(element => {
    prog += ProgressBar(element.percentage, { fullChr: element.square, emptyChr: "", blocks })
  })

  prog += ProgressBar((blocks - prog.length) / blocks * 100, { fullChr: "⬜", emptyChr: "" });

  return prog;
}

/**
 * @param {Client} client 
 */
const UpdateCommands = async function (client) {
  const ClientCommands = new Commands();
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

  const doc = await Guilds.getWork(message.guild.id);
  const member = message.member;
  const link = Links.some(x => message.content.includes(x));

  if (!doc.moduleIsActive("automoderation.remove_links")) return false;
  if (!member.permissions.missing(PermissionsBitField.Flags.EmbedLinks).length > 0) return false;

  if (!link && message.embeds.length < 1) return false;

  message.delete().catch(err => {
    console.error("🔴 %s", err);
  });

  message.author.send({
    embeds: [
      new Embed()
        .defAuthor({ text: `No envíes links`, title: true })
        .defDesc(`Detecté que incluiste un link en tu mensaje:
${codeBlock(message.content)}`)
        .defFooter({ text: `Discúlpame si fue un error :)`, icon: message.guild.iconURL() })
        .defColor(Colores.rojo)
    ]
  })
    .catch(async err => {
      let msg = await message.channel.send(`No envíes links, **${message.member.displayName}**.`)
        .catch(err => {
          console.error("🔴 %s", err);
        });

      setTimeout(() => {
        msg.delete()
          .catch(err => {
            console.error("🔴 %s", err);
          });
      })
    });

  try {
    new Log(message)
      .setTarget(ChannelModules.ModerationLogs)
      .setReason(LogReasons.AutoMod)
      .send({
        embeds: [
          new Embed()
            .defAuthor({ text: `Se eliminó un mensaje de ${message.author.username}`, icon: member.displayAvatarURL() })
            .defDesc(`${codeBlock(message.content)}`)
            .defColor(Colores.verde)
            .defFooter({ text: "NO se aplicaron sanciones", timestamp: true })
        ]
      })
  } catch (err) {
    console.error("🔴 %s", err);
  }

  return true;


}

/**
 * @param {Client} client 
 * @param {Guild | String} guild 
 */
const FetchThisGuild = async function (client, guild) {
  await client.guilds.fetch(guild.id ?? guild);
  await guild.channels.fetch();
  await guild.roles.fetch();
  await guild.members.fetch();
  await guild.emojis.fetch();
  await guild.commands.fetch();

  client.fetchedGuilds.push(guild.id);

  console.log("💚 %s fetched!", guild.name)
}

/**
 * 
 * @param {Users} user Mongoose Document
 * @returns 
 */
const BoostWork = function (user) {
  let boost = {
    multiplier: {
      changed: {
        currency: false,
        exp: false
      },
      currency_value: 1,
      exp_value: 1
    },
    probability: {
      changed: {
        currency: false,
        exp: false
      },
      currency_value: 1,
      exp_value: 1
    },
    emojis: {
      currency: "🚀",
      exp: "🚀"
    },
    hasMultiplierChanges: () => { return boost.multiplier.changed.currency || boost.multiplier.changed.exp },
    hasProbabilityChanges: () => { return boost.probability.changed.currency || boost.probability.changed.exp },
    hasAnyChanges: () => { return boost.multiplier.changed.currency || boost.multiplier.changed.exp || boost.probability.changed.currency || boost.probability.changed.exp },
    hasCurrencyChanges: () => { return boost.probability.changed.currency || boost.multiplier.changed.currency },
  }

  for (const userboost of user.data.temp_roles) {
    const boostinfo = userboost.special;

    let propToChange;
    switch (boostinfo.type) {
      case BoostTypes.Multiplier:
        propToChange = "multiplier";
        break;
      case BoostTypes.Probability:
        propToChange = "probability";
        break;
    }

    switch (boostinfo.objetive) {
      case BoostObjetives.Currency:
        boost[propToChange].changed.currency = true;
        boost[propToChange].currency_value *= boostinfo.value;
        break;

      case BoostObjetives.Exp:
        boost[propToChange].changed.exp = true;
        boost[propToChange].exp_value *= boostinfo.value;
        break;

      case BoostObjetives.All:
        boost[propToChange].changed.currency = true;
        boost[propToChange].changed.exp = true;
        boost[propToChange].exp_value *= boostinfo.value;
        boost[propToChange].currency_value *= boostinfo.value;
        break;
    }
  }

  if (boost.hasMultiplierChanges() && boost.hasProbabilityChanges()) {
    boost.emojis.currency = boost.multiplier.currency_value * boost.probability.currency_value <= 1 ? "😟" : "🚀";
    boost.emojis.exp = boost.multiplier.exp_value * boost.probability.exp_value <= 1 ? "😟" : "🚀";
  } else {
    if (boost.hasMultiplierChanges()) {
      boost.emojis.currency = boost.multiplier.currency_value <= 1 && boost.multiplier.changed.currency ? "😟" : "🚀";
      boost.emojis.exp = boost.multiplier.exp_value <= 1 && boost.multiplier.changed.exp ? "😟" : "🚀";
    }

    if (boost.hasProbabilityChanges()) {
      boost.emojis.currency = boost.probability.currency_value <= 1 && boost.probability.changed.currency ? "😟" : "🚀";
      boost.emojis.exp = boost.probability.exp_value <= 1 && boost.probability.changed.exp ? "😟" : "🚀";
    }
  }

  return boost;
}

/**
 * 
 * @param {Guild} guild 
 * @param {Number | String} quantity 
 * @param {String} param2 
 * @returns 
 */
const PrettyCurrency = function (guild, quantity, { name, boostemoji } = { name: null, boostemoji: null }) {
  const client = guild.client;
  const emojis = client.getCustomEmojis(guild.id);

  return `**${emojis[name ?? "Currency"]}${Number(quantity).toLocaleString("es-CO")}${boostemoji ?? ""}**`;
}


const MinMaxInt = function (min, max, { guild, msg }) {
  let value = 0;
  try {
    value = new Chance().integer({ min, max });
  } catch (err) {
    if (err instanceof RangeError) {
      new Log()
        .setGuild(guild)
        .setReason(LogReasons.Error)
        .setTarget(ChannelModules.StaffLogs)
        .send({
          embeds: [
            new ErrorEmbed()
              .defDesc(`${msg}. Mínimos y máximos deben ser menores y mayores los unos con los otros. ${guild.client.mentionCommand("config dashboard")}.`)
              .defFields([
                { up: "Min", down: String(min), inline: true },
                { up: "Max", down: String(max), inline: true },
              ])
              .raw()
          ]
        });
    }
  }

  return value;
}

/**
 * Vuelve lo de la derecha ceros
 * @param {Number} number El número a tratar
 * @param {Number} initials Los primeros qué números se mantienen
 * @param {Number} zeros Cuantos ceros se quieren al final (sobreescribe los initials)
 * @returns {Number}
 */
const PrettifyNumber = function (number, initials = 1, zeros = null) {
  const original = String(number);
  let returning = null;
  if (!zeros) {
    let firstPart = original.substring(0, initials - 1);
    let secondPart = "0".repeat(original.length - firstPart.length);

    returning = Number(firstPart + secondPart);
  } else {
    if (zeros < original.length) {
      let firstPart = original.substring(0, original.length - zeros - 1);
      let secondPart = "0".repeat(zeros);

      returning = Number(firstPart + secondPart);
    }
  }

  if (isNaN(returning) || returning <= 0)
    return number

  return returning;
}

/**
 * @param {BaseInteraction} interaction 
 * @param {Message} message 
 * @param {User} user
 */
const CreateInteractionFilter = function (interaction, message, user) {
  return (inter) => {
    let flat = message.components.flatMap((row) => {
      return row.components.flatMap((comp) => {
        return comp.customId
      });
    })

    return flat.find(x => x === inter.customId) && inter.user.id === (user?.id ?? interaction.user.id);
  }
}

/**
 * 
 * @param {BaseInteraction|null} interaction 
 * @param {GuildMember} member 
 * @param {Enum} type 
 * @param {import("discord.js").MessageCreateOptions} options 
 * @param {Boolean} guildInfo Incluir información de dónde se envía el mensaje directo en el último embed dentro de options
 * @returns {Promise<void>}
 */
const SendDirect = async function (interaction, member, type, options, guildInfo = true) {
  const client = interaction?.client ?? member?.client ?? null;
  if (!client || client.toggles.functionDisabled(ToggleableFunctions.SendDirect)) {
    let guild = client.guilds.cache.get(Bases.dev.guild)
    let channel = guild.channels.cache.get(Bases.dev.logs)

    try {
      await channel.send({
        embeds: [
          new Embed()
            .defAuthor({ text: `Intento de SendDirect`, icon: client.user.displayAvatarURL() })
            .defDesc(`**▸** Un mensaje directo fue intentado de ser enviado a ${member.user.username} (${member.id}) pero la función está toggleada.\n**▸** Tipo SendDirect: **${new Enum(DirectMessageType).translate(type)}**\n**▸** ${interaction ? `Interacción: ${interaction.commandName}` : "Sin interacción asociada"}`)
            .defColor(Colores.rojo)
        ]
      })
    } catch (err) {
      console.error("🔴 %s", err);
    }
    
    //console.log("⚪ Se intentó enviar un mensaje directo a %s pero esta función está toggleada.", member.user.username);
    return;
  }

  const preferences = await Preferences.getWork(member.id);
  let flags = [];

  // Es el primer DM que se le envía al usuario
  if (!preferences.direct_messages.firstDmSent) {
    try {
      await member.send({
        embeds: [
          new Embed()
            .defThumbnail(member.client.user.displayAvatarURL())
            .defDesc(`# ¡Hola, ${member.displayName}!\nSoy ${member.client.Emojis.JeffreyBot} ${member.client.user.displayName}, puedes configurar tus preferencias para mensajes directos con ${member.client.mentionCommand("preferencias")}.\n**No volverás a recibir este mensaje en un futuro!**`)
            .defColor(Colores.verdejeffrey)
        ]
      })

      preferences.direct_messages.firstDmSent = true;
      await preferences.save();
    } catch (err) {
      console.error("🔴", err);
    }
  }

  if (!preferences.direct_messages.options.allowed)
    throw new DMNotSentError(interaction, member, "El usuario deshabilitó los mensajes directos para Jeffrey Bot")

  if (preferences.direct_messages.options.supressed) flags.push(MessageFlags.SuppressNotifications);

  let path = "direct_messages.allowed." + new Enum(DirectMessageType).translate(type, false).toLowerCase();
  const allowed = preferences.get(path);

  if (!allowed)
    throw new DMNotSentError(interaction, member, `El usuario deshabilitó este módulo (${new Enum(DirectMessageType).translate(type)})`);

  if (guildInfo) {
    if (!options.embeds.at(-1).data.footer || !options.embeds.at(-1).data.footer.text) {
      options.embeds.at(-1).data.footer = {
        text: member.guild.name,
        icon_url: member.guild.iconURL()
      }
    } else {
      options.embeds.at(-1).data.footer.text = options.embeds.at(-1).data.footer.text ? options.embeds.at(-1).data.footer.text + " • " + member.guild.name : member.guild.name;
      if (!options.embeds.at(-1).data.footer.icon_url) options.embeds.at(-1).data.footer.icon_url = member.guild.iconURL();
    }
  }

  await member.send({ ...options, flags });
}

/**
 * 
 * @param {String} line 
 * @returns String
 */
const FinalPeriod = function (line) {
  let d = line;
  if (!line.endsWith(".") && !(line.endsWith(":") || line.endsWith("!") || line.endsWith("```") || line.endsWith("?") || line.endsWith("||"))) d += `.`;

  return d;
}

const Encrypt = (text) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(process.env.APP_SECRET, salt, 100000, 32, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

module.exports = {
  GetChangesAndCreateFields,
  FetchAuditLogs,
  GlobalDatasWork,
  ManageDarkShops,
  VaultWork,
  LimitedTime,
  Subscription,
  handleNotification,
  Confirmation,
  AfterInfraction,
  ValidateDarkShop,
  FindNewId,
  DaysUntilToday,
  WillBenefit,
  importImage,
  GenerateLog,
  isOnMobible,
  RandomCumplido,
  Sleep,
  MemberHasAnyRole,
  isDeveloper,
  ActivityWork,
  UpdateObj,
  ProgressBar,
  UpdateCommands,
  DeleteLink,
  FindAverage,
  FetchThisGuild,
  BoostWork,
  PetWork,
  PrettyCurrency,
  TimeoutIf,
  MinMaxInt,
  PrettifyNumber,
  MultiplePercentages,
  CreateInteractionFilter,
  SendDirect,
  FinalPeriod,
  FindNewIds,
  Encrypt
}
