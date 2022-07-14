const Config = require("./../base.json");
const Emojis = require("./../resources/emojis.json");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Legacy = require("../modelos/legacy.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let legacyrole;

  if(args[0]) legacyrole = guild.roles.cache.find(x => x.id === args[0]);

  let report = await message.channel.send(`${Emojis.Loading} Reuniendo todos los miembros...`);

  await guild.members.fetch();

  const members = guild.members.cache;

  await report.edit(`${Emojis.Loading} Actualizando la base de datos...`);

  let q = await Legacy.findOne({
    guild_id: guild.id
  });

  if(!q) q = await new Legacy({
      guild_id: guild.id
  }).save();

  let userList = [];

  members.forEach(member => {
    if(legacyrole) member.roles.add(legacyrole);

    let roles = [];

    member.roles.cache.forEach(r => {
        roles.push(r.name);
    })

      userList.push({
          user_id: member.id,
          roles,
          member_since: member.joinedAt
      })
  });

  q.user_list = userList;
  q.lastupdate = new Date();

  await report.edit(`${Emojis.Loading} Guardando base de datos...`);
  
  await q.save();

  return report.edit(`✅ Se ha actualizado la Legacy List.`);
}

module.exports.help = {
    name: "legacy"
}
