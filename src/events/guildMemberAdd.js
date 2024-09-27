const { time } = require("discord.js");

const { GenerateLog, DaysUntilToday, FetchThisGuild } = require("../utils/");
const { Colores } = require("../resources");

const { Users, Guilds } = require("mongoose").models;

module.exports = async (client, member) => {
  const guild = member.guild;

  if (!client.isThisFetched(guild.id)) await FetchThisGuild(client, guild);

  // crear usuario nuevo
  const user = await Users.getWork({
    user_id: member.id,
    guild_id: guild.id
  });

  const doc = await Guilds.getWork(guild.id);

  // cargar los roles que tenia antes
  if (doc.moduleIsActive("functions.save_roles_onleft", doc.settings)) user.data.backup_roles.forEach(roleId => {
    const role = guild.roles.cache.get(roleId);
    if (role) member.roles.add(role).catch(err => {
      console.error("🔴 %s", err);
    });

    user.data.backup_roles = [];
  })

  await user.save();

  if (member.user.bot) {
    let botRoles = doc.getBots();
    botRoles.forEach(role => member.roles.add(role)
      .catch(err => {
        console.error("🔴 %s", err);
      }));
  }

  /* TODO: En algún momento, debería ser posible configurar enviar un mensaje a los nuevos usuarios
  
  let reglasC = guild.channels.cache.get(doc.getChannel("general.rules")) ?? "#reglas";
  let infoC = guild.channels.cache.get(doc.getChannel("general.information")) ?? "#info";
  
  let bienvenidas = [
    `Bienvenid@ a \`${guild.name}\`, **${tag}**. Pásate por ${reglasC} e ${infoC} para aclarar las dudas frecuentes! ¡Disfruta!`,
    `¡Hola, **${tag}**! Muchas gracias por unirte a \`${guild.name}\`, ve a los canales: ${reglasC} e ${infoC} para evitar inconvenientes, y ¡pásala bien!`,
    `¡Eyyy, **${tag}**! Bienvenid@ a \`${guild.name}\` 🎉 ¡Echa un vistazo a ${reglasC} e ${infoC} para que te guíes dentro del server! :D`,
    `¡Hey! Hola **${tag}**, gracias por unirte a \`${guild.name}\` 😄 ¡Pásate por ${reglasC} e ${infoC} para que te hagas una idea de como funciona el server!`
  ];

  let fBienv = new Chance().pickone(bienvenidas);

  let embed = new Embed()
    .defDesc(fBienv)
    .defFooter({ text: `* Para poder hablar en el chat debes aceptar las reglas`, icon: guild.iconURL() })
    .defColor(Colores.verde);

  try {
    await SendDirect(null, member, DirectMessageType.Welcome, { embeds: [embed] })
  } catch (err) {
    console.error("🔴 %s", err.message());
  } */

  member.guild.invites.fetch().then((invites) => {
    invites.forEach(async invite => {
      if (invite.uses != client.invites[invite.code]) {
        await GenerateLog(guild, {
          header: "Nuevo miembro en el servidor",
          description: [
            `${member} el ${time(member.joinedAt)}.`,
            `Usando la invitación **discord.gg/${invite.code}**, con **${invite.uses}** usos.`,
            `Su cuenta tiene **${Math.floor(await DaysUntilToday(member.user.createdAt))}** días de edad (${time(member.user.createdAt)}).`,
            `¡Ahora somos **${member.guild.memberCount}** miembros en el servidor!`
          ],
          footer_icon: member.displayAvatarURL(),
          color: Colores.verde
        }).catch(err => {
          console.error("🔴 %s", err);
        });
      }
    })
  }).catch(err => {
    console.error("🔴 %s", err);
  });
}