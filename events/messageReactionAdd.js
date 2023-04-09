const { GlobalDatas, Guilds } = require("mongoose").models;

module.exports = async (client, reaction, user) => {
  if (user.bot) return;
  if (!reaction?.count) return;

  const guild = reaction.message.guild;
  const channel = reaction.message.channel;
  const message = await channel.messages.fetch(reaction.message.id);

  // AUTOROLES
  const doc = await Guilds.getOrCreate(guild.id);

  doc.workerAddAutoRole(message, reaction, user);

  // ENCUESTAS
  let poll = await GlobalDatas.findOne({
    type: "temporalPoll",
    "info.guild_id": guild.id,
    "info.message_id": message.id
  });

  if (!poll) return;
  return reaction.users.remove(user);
}