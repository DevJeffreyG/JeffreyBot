const Discord = require("discord.js");

const { time } = Discord;
const { GenerateLog, DaysUntilToday, Embed, GetRandomItem } = require("../src/utils/");
const { Colores, Config } = require("../src/resources");

const { Users, Guilds} = require("mongoose").models;

module.exports = async (client, member) => {
  let tag = member.user.tag;
  const guild = member.guild;

  // crear usuario nuevo
  const user = await Users.getOrCreate({
    user_id: member.id,
    guild_id: guild.id
  });

  const doc = await Guilds.getOrCreate(guild.id);

  // cargar los roles que tenia antes
  if(doc.moduleIsActive("functions.save_roles_onleft", doc.settings)) user.data.backup_roles.forEach(roleId => {
    const role = guild.roles.cache.find(x => x.id === roleId);
    if (role) member.roles.add(role);

    user.data.backup_roles = [];
    user.save();
  })

  let reglasC = guild.channels.cache.get(doc.getChannel("general.rules"));
  let infoC = guild.channels.cache.get(doc.getChannel("general.information"));

  if (member.user.bot) {
    let botRoles = doc.getBots();
    botRoles.forEach(role => member.roles.add(role))
  }

  let bienvenidas = [
    `Bienvenid@ a \`${guild.name}\`, **${tag}**. Pásate por ${reglasC} e ${infoC} para aclarar las dudas frecuentes! ¡Disfruta!`,
    `¡Hola, **${tag}**! Muchas gracias por unirte a \`${guild.name}\`, ve a los canales: ${reglasC} e ${infoC} para evitar inconvenientes, y ¡pásala bien!`,
    `¡Eyyy, **${tag}**! Bienvenid@ a \`${guild.name}\` 🎉 ¡Echa un vistazo a ${reglasC} e ${infoC} para que te guíes dentro del server! :D`,
    `¡Hey! Hola **${tag}**, gracias por unirte a \`${guild.name}\` 😄 ¡Pásate por ${reglasC} e ${infoC} para que te hagas una idea de como funciona el server!`
  ];

  let fBienv = GetRandomItem(bienvenidas);

  let embed = new Embed()
    .defDesc(fBienv)
    .defFooter({text: `* Para poder hablar en el chat debes aceptar las reglas`, icon: guild.iconURL()})
    .defColor(Colores.verde);

  member.send({ embeds: [embed] }).catch(e => {});

  member.guild.invites.fetch().then((invites) => {
    invites.forEach(async invite => {
      if (invite.uses != client.invites[invite.code]) {
        GenerateLog(guild, {
          header: "Nuevo miembro en el servidor",
          description: [
            `${member} el ${time(member.joinedAt)}.`,
            `Usando la invitación **discord.gg/${invite.code}**, con **${invite.uses}** usos.`,
            `Su cuenta tiene **${Math.floor(await DaysUntilToday(member.user.createdAt))}** días de edad (${time(member.user.createdAt)}).`,
            `¡Ahora somos **${member.guild.memberCount}** miembros en el servidor!`
          ],
          footer_icon: member.displayAvatarURL({ dynamic: true }),
          color: Colores.verde
        });
      }
    })
  })
}