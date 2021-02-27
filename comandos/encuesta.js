const Config = require("./../base.json");
const prefix = Config.prefix;

module.exports.run = async (client, message, args) => {

      if(!message.content.startsWith(prefix))return;

  if(!args[0]) return message.channel.send("Ejem, ejem...\n¿Cuál es la encuesta...?");
  message.react("✅")
  .then(message.react("🤷"))
  .then(message.react("❌"));
}

module.exports.help = {
    name: "encuesta",
    alias: "poll"
}