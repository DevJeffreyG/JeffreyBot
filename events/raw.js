const events = {
    MESSAGE_REACTION_ADD: "messageReactionAdd",
    MESSAGE_REACTION_REMOVE: "messageReactionRemove"
};

module.exports = async (client, event) => {
    if (!events.hasOwnProperty(event.t)) return;

    const { d: data } = event;
    const user = client.users.cache.get(data.user_id);
    const channel = client.channels.cache.get(data.channel_id) || (await user.createDM());
  
    if (channel.messages.cache.has(data.message_id)) return;
  
    const message = await channel.messages.fetch(data.message_id);
    const emojiKey = data.emoji.id ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
    let reaction = message.reactions.cache.get(emojiKey);
  
    if (!reaction) {
      reaction = message.reactions.cache.get(data.emoji.id);
    }
  
    client.emit(events[event.t], reaction, user);
}