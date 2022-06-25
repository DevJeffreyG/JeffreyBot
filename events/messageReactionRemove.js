const Discord = require("discord.js");

const Config = require("../src/resources/base.json");
const { disableAwards, jeffreygID } = Config;

const { AutoRoles } = require("mongoose").models;;

module.exports = async (client, reaction, user) => {
    if (user.bot) return;
    if(!reaction) return; // wtf?

    const guild = reaction.message.guild;
    const channel = reaction.message.channel;
    const message = reaction.message;
    const member = guild.members.cache.get(user.id);
  
    AutoRoles.findOne({
        serverID: guild.id,
        channelID: channel.id,
        messageID: message.id,
        emoji: reaction.emoji.id || reaction.emoji.name
    }, (err, msg) => {
        if (err) throw err;
        if(!msg) return;
        
        const role = guild.roles.cache.find(x => x.id === msg.roleID);

        if (msg.custom === 1) {
            if (reaction.emoji.id === msg.emoji) {
                member.roles.remove(role);
            }
        } else {
            if (reaction.emoji.name === msg.emoji) {
                member.roles.remove(role);
            }
        }
    });
}