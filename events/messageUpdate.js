const Discord = require("discord.js");

const Config = require("../base.json");
const { jeffreygID } = Config;

const User = require("../modelos/User.model.js");
const Guild = require("../modelos/Guild.model.js");
const AutoRole = require("../modelos/autorole.js");

const { jeffreyMentions, startLinks } = require("../index.js");

module.exports = async (client, oldMessage, message) => {
    const docGuild = await Guild.findOne({guild_id: message.guild.id}) ?? await new Guild({guild_id: message.guild.id}).save();
    const prefix = docGuild.settings.prefix;
    const channel = message.channel;
    const author = message.author;
  
    if (author.bot) return;
    if (message.channel.type == "DM") return;
    if (author.bot) return;
    if (author.id === jeffreygID) return;
    if (message.content.startsWith(prefix)) return;
    
    let log = message.guild.channels.cache.find(x => x.id === Config.logChannel);
  
    let adminRole = message.guild.roles.cache.find(x => x.id === Config.adminRole);
    let modRole = message.guild.roles.cache.find(x => x.id === Config.modRole);
    let staffRole = message.guild.roles.cache.find(x => x.id === Config.staffRole);
    let offtopicChannel = message.guild.channels.cache.find(x => x.id === Config.offtopicChannel);
    let spamChannel = message.guild.channels.cache.find(x => x.id === Config.spamChannel);
    let gdpsSupportChannel = message.guild.channels.cache.find(x => x.id === Config.gdpsSupportChannel);
  
    if(client.user.id === Config.testingJBID){
      adminRole = message.guild.roles.cache.find(x => x.id === "483105079285776384");
      modRole = message.guild.roles.cache.find(x => x.id === "483105108607893533");
      staffRole = message.guild.roles.cache.find(x => x.id === "535203102534402063");
      log = message.guild.channels.cache.find(x => x.id === "483108734604804107");
      offtopicChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
      spamChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
      gdpsSupportChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
    }
  
    // Si mencionan a Jeffrey, mención en #log
    
    let contentMsg = message.content.toLowerCase();
  
    let embed = new Discord.MessageEmbed()
    .setAuthor(`${author.tag}`, author.displayAvatarURL())
    .setDescription(`**__${author.username}__** dice: "\`${message.content}\`".`)
    .setFooter(`Mencionaron a Jeffrey.`, message.guild.iconURL())
    .setColor(Colores.verde)
    .setTimestamp();
  
  
    for (let i = 0; i < jeffreyMentions.real.length; i++) {
      const mention = jeffreyMentions.real[i];
      
      if(contentMsg.includes(mention)){
        // falsos positivos JAJA
        let fake = false;
  
        falso:
        for (let i = 0; i < jeffreyMentions.false.length; i++) {
          const falso = jeffreyMentions.false[i];
          
          if(contentMsg.includes(falso)) {
            fake = true;
            break falso;
          }
        }
  
        if(fake) return;
        if (message.channel.id === Config.offtopicChannel) return;
        if (message.channel.id === "829153564353101854") return; // evento de coins 2
        if (message.channel.id === Config.spamChannel) return;
  
        if (message.member.roles.cache.find(x => x.id === staffRole.id)) return log.send({content: `Un **STAFF** ha mencionado a Jeffrey en ${message.channel}.`, embeds: [embed]});
        else return log.send({content: `Han mencionado a <@${jeffreygID}> en ${message.channel}.`, embeds: [embed]});
      }
    }
  
    // links
    if (message.member.permissions.has("EMBED_LINKS") || channel === offtopicChannel || channel === spamChannel || channel === gdpsSupportChannel) return;
  
    for (let i = 0; i < startLinks.length; i++) {
      const start = startLinks[i];
      
      if(contentMsg.includes(start)){
        await message.delete();
        return message.channel.send(`No envíes links, **${author.tag}**`);
      }
    }
}