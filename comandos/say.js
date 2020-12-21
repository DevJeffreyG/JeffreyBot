const Config = require("./../base.json");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const botsChannel = Config.botsChannel;
const botsVip = Config.botsVip;

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
    
  if(!message.content.startsWith(prefix))return;

  if(bot.user.id === Config.testingJBID){
    return message.channel.send("Este comando es de uso exclusivo del server por las diferentes variables que se encuentran en código.")
  }

  if(message.channel.id != botsChannel && message.channel.id != botsVip && author.id === jeffreygID){
    if(!args[0]){
      return message.reply(`Faltó el canal al donde enviar el mensaje.`);
    }

    let mChannel = message.mentions.channels.first() || guild.channel.get(args[0]);

    let botMessage = args.join(" ").slice(args[0].length + 1);

    message.delete();
    message.channel.send(`Enviando mensaje...`)
    .then(() => {
      mChannel.startTyping();

      setTimeout(() => {
        mChannel.send(botMessage);
        mChannel.stopTyping();
      }, ms("3s"));
    })
  } else {
    if(!args[0] && !args[1]) return message.channel.send("No tengo nada que decir. ;_;");
    let botMessage = args.join(" ");
    message.delete().catch();
    message.channel.send(botMessage);
  }
}

module.exports.help = {
    name: "say",
    alias: "di"
}