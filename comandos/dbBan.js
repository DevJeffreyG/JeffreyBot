const Config = require("./../base.json");
const jeffreygID = Config.jeffreygID;

/* ##### MONGOOSE ######## */

const Banned = require("../modelos/banned.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  let uDbBan = args[0];
  let razon = args.join(" ").slice(args[0].length + 1);

  if(author.id != jeffreygID) return;

  Banned.findOne({
    userID: uDbBan
  }, (err, baneado) => {
    if(err) throw err;

    if(!baneado){
      if(!razon) return message.reply(`Falta la razón.`)

      const ban = new Banned({
          _id: mongoose.Types.ObjectId(),
          userID: uDbBan,
          razon: razon
      });

      ban.save()
      .then(result => console.log(result))
      .catch(err => console.log(err));

      return message.reply(`Baneado.`);
    }else{
      return message.reply(`Ya está baneado.`)
    }
  })
  
}

module.exports.help = {
    name: "dbban",
    alias: "banbug"
}
