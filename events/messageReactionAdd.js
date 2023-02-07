const { GlobalDatas, Guilds } = require("mongoose").models;

module.exports = async (client, reaction, user) => {
    if (user.bot) return;

    const guild = reaction.message.guild;
    const channel = reaction.message.channel;
    const message = await channel.messages.fetch(reaction.message.id);

    // AUTOROLES
    const doc = await Guilds.getOrCreate(guild.id);
    doc.workerAddAutoRole(message, reaction, user)

    // ENCUESTAS
    GlobalDatas.findOne({
      "info.type": "temporalPoll",
      "info.guild_id": guild.id,
      "info.message_id": message.id
    }, (err, poll) => {
      if(err) throw err;

      const reactionfilter = x => x.emoji.id === client.EmojisObject.Check.id || x.emoji.id === client.EmojisObject.Cross.id;

      if(!poll) return;
      if(!reactionfilter(reaction)) return reaction.users.remove(user);

      const reactionToFind = reaction.emoji.id === client.EmojisObject.Cross.id ? client.EmojisObject.Check.id : client.EmojisObject.Cross.id;

      const reactionToDelete = message.reactions.cache.find(x => x.emoji.id === reactionToFind);

      reactionToDelete.users.remove(user);
    })
}