const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const mainChannel = Config.mainChannel;

/* ##### MONGOOSE ######## */

const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;

  let member;

  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}bd`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}bd <config> <nueva config> \n▸ Cambias uno de tus ajustes de cumpleaños.
**———— Configs ————**
**—** \`lock\`: (coming soon) Bloqueas el poder seguir cambiando la configuracion de tu fecha de nacimiento por un año. Cuando hagas esto, ya podrás recibir los beneficios el role el día de tu cumpleaños.
**—** \`all\`: Determina tu fecha de cumpleaños con el formato DD MM.
**—** \`dia\`: Se cambia el día de tu fecha de cumpleaños.
**—** \`mes\`: Se cambia el mes de tu fecha de cumpleaños.
  `)
  .setFooter(`<> Obligatorio () Opcional — Para ver tu fecha registrada actual revisa ${prefix}stats`);

  if(!args[0] || !args[1]) return message.channel.send(embed);

  let day;
  let month;
  let dateString;

  GlobalData.findOne({
    "info.type": "birthdayData",
    "info.userID": author.id
  }, async (err, userBD) => {
    if(err) throw err;

    let query = false;
    if(!userBD){
      newBD = new GlobalData({
        info: {
          type: "birthdayData",
          userID: author.id,
          birthd: null,
          birthm: null,
          isLocked: false
        }
      });

      await newBD.save();

      query = await GlobalData.findOne({
        "info.type": "birthdayData",
        "info.userID": author.id
      });
    }

    userBD = query ? query : userBD;

    switch(args[0].toLowerCase()){
      case "all":
        // bd all DD MM
        day = !isNaN(args[1]) && (Number(args[1]) <= 31) && (Number(args[1]) > 0) ? args[1] : null;
        month = !isNaN(args[2]) && (Number(args[2]) <= 12) && (Number(args[2]) > 0) ? args[2] : null;

        if(!day || !month) return message.channel.send(embed);

        userBD.info.birthd = day;
        userBD.info.birthm = month;

        userBD.markModified("info");
        userBD.save();
        return message.react("✅")

      case "dia":
        // bd dia DD
        day = !isNaN(args[1]) && (Number(args[1]) <= 31) && (Number(args[1]) > 0) ? args[1] : null;

        if(!day) return message.channel.send(embed);

        userBD.info.birthd = day;

        userBD.markModified("info");
        userBD.save();
        return message.react("✅")
      case "mes":
        // bd mes MM
        month = !isNaN(args[1]) && (Number(args[1]) <= 12) && (Number(args[1]) > 0) ? args[1] : null;

        if(!month) return message.channel.send(embed);

        userBD.info.birthm = month;

        userBD.markModified("info");
        userBD.save();
        return message.react("✅")
        
      default:
        return message.channel.send(embed);
    }
  })
}

module.exports.help = {
    name: "bd"
}
