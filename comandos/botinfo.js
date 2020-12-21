const Config = require("./../base.json");
const Package = require("./../package.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const versioninfo = Config.version;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;
  
  let embed = new Discord.MessageEmbed()
  .setDescription(`**Jeffrey Bot v\`${Package.version}\`**.\n\n${versioninfo}\n\n*El bot puede tener cambios. Para saberlos, usa este mismo comando.*`)
  .setColor(Colores.verde);
  
  message.channel.send(embed);

}

module.exports.help = {
    name: "botinfo",
    alias: "bot"
}
