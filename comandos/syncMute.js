const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  const guild = message.guild;
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let muteRole = guild.roles.cache.find(x => x.id === Config.muteRole);

  if(client.user.id === Config.testingJBID){
    staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }
  
  if (!message.member.roles.cache.find(x => x.id === staffRole.id)) return;

  message.guild.channels.cache.each(async (channel, id) => {
    await channel.overwritePermissions(muteRole, {
      VIEW_CHANNEL: false,
      SEND_MESSAGES: false,
      ADD_REACTIONS: false
    });
  });
  
  message.react("✅");

}

module.exports.help = {
    name: "syncmute",
    alias: "sMute"
}
