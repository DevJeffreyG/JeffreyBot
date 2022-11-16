const Discord = require("discord.js");

const { time } = Discord;
const { GenerateLog, DaysUntilToday, Initialize } = require("../src/utils/");
const { Colores, Config } = require("../src/resources");

const { Users } = require("mongoose").models;

module.exports = async (client, member) => {
  let tag = member.user.tag;
  const guild = member.guild;
  let channel = guild.channels.cache.find(x => x.id === Config.mainChannel);
  let reglasC = guild.channels.cache.find(x => x.id === Config.rulesChannel);
  let infoC = guild.channels.cache.find(x => x.id === Config.infoChannel);
  let botRole = guild.roles.cache.find(x => x.id === Config.botRole);

  const prefix = await Initialize(member.guild.id);

  if (client.user.id === Config.testingJBID) {
    channel = guild.channels.cache.find(x => x.id === "535500338015502357");
    reglasC = guild.channels.cache.find(x => x.id === "482993020472393741");
    infoC = guild.channels.cache.find(x => x.id === "483007894942515202");
    botRole = guild.roles.cache.find(x => x.id === "794646554690322432");
  }

  if (member.user.bot) {
    return member.roles.add(botRole);
  }

  let bienvenidas = [
    `Bienvenid@ a \`${guild.name}\`, **${tag}**. Pásate por ${reglasC} e ${infoC} para aclarar las dudas frecuentes! ¡Disfruta!`,
    `¡Hola, **${tag}**! Muchas gracias por unirte a \`${guild.name}\`, ve a los canales: ${reglasC} e ${infoC} para evitar inconvenientes, y ¡pásala bien!`,
    `¡Eyyy, **${tag}**! Bienvenid@ a \`${guild.name}\` 🎉 ¡Echa un vistazo a ${reglasC} e ${infoC} para que te guíes dentro del server! :D`,
    `¡Hey! Hola **${tag}**, gracias por unirte a \`${guild.name}\` 😄 ¡Pásate por ${reglasC} e ${infoC} para que te hagas una idea de como funciona el server!`
  ];

  let fBienv = bienvenidas[Math.floor(Math.random() * bienvenidas.length)];

  if (member.user.id === "373901344995803138") {
    // si el usuario es ares
    fBienv = `Hola **${tag}**. Bienvenido, otra vez.`;
  }

  let embed = new Discord.EmbedBuilder()
    .setDescription(fBienv)
    .setFooter(`* Para poder hablar en el chat debes aceptar las reglas`, guild.iconURL())
    .setColor(Colores.verde);

  member.send({ embeds: [embed] }).catch(e => {
    channel.send({ embeds: [embed] });
  });

  // crear usuario nuevo
  let query = await Users.findOne({
    user_id: member.id,
    guild_id: member.guild.id
  });

  if (!query) {
    const newUser = new Users({
      user_id: member.id,
      guild_id: guild.id
    });

    newUser.save();
  } else { // cargar los roles que tenia antes
    query.data.backup_roles.forEach(roleId => {
      const role = guild.roles.cache.find(x => x.id === roleId);
      if (role) member.roles.add(role);
    })

    query.data.backup_roles = [];
    query.save();
  }

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



  client.user.setActivity(`/ayuda - ${member.guild.memberCount} usuarios🔎`);
}