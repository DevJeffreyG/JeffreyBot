const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;
const logChannel = Config.logChannel;
const changes = Config.changes;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Key = require("../modelos/keys.js");
const GlobalData = require("../modelos/globalData.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  if(client.user.id === Config.testingJBID){
      jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
      adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
      modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
      staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
  }
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}redeem`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}redeem <key> \n▸ Si tienes alguna clave puedes redmirla para ganar cosas dentro del servidor.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}key`);

  if(args[0] && args[0].toLowerCase() == "add"){
      if(!message.member.roles.cache.find(x => x.id === staffRole.id)) return message.channel.send(embed);
      // poder agregar jeffros, roles, exp, boosts

      // generar nueva key
      let generatedID = 1;
      let keysq = await Key.find();

      // id
      for (let i = 0; i < keysq.length; i++) {
          const keys = keysq[i];
          
          if(keys.id == generatedID) generatedID++
      }

      // code
      let generatedCode = generateCode()
      while (await findKey(generatedCode)) {
        generatedCode = generateCode();
      }

      let staff = new Discord.MessageEmbed()
      .setTitle(`Ayuda: ${prefix}redeem`)
      .setColor(Colores.nocolor)
      .setDescription(`▸ El uso correcto es: ${prefix}redeem add <jeffros | role | exp | boost> <$ | id | # | tipo de boost> (usos máximos de la key) (tiempo del boost | role) \n▸ Generas una nueva KEY.`)
      .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}key`);

      if(!args[1]) return message.channel.send(staff);
      if(!args[2]) return message.channel.send(staff);
      if(args[1].toLowerCase() == "boost" && !args[4]) return message.channel.send(staff);
      if(args[1].toLowerCase() == "role" && !args[4]) return message.channel.send(staff);
      let action = args[1].toLowerCase();

      if(action === "jeffros" || action === "exp"){
        let value = Number(args[2]) ? Number(args[2]) : null;
        let maxuses = Number(args[3]) ? Number(args[3]) : 1;
        if(!value) return message.channel.send(staff);

        const newKey = new Key({
            guild_id: message.guild.id,
            config: {
                maxuses: maxuses
            },
            reward: {
                type: action,
                value: value
            },
            code: generatedCode,
            id: generatedID
        })

        await newKey.save();
      } else {
          
      }

      let added = new Discord.MessageEmbed()
      .setAuthor("| Listo", Config.bienPng)
      .setDescription(`**—** Se ha generado una nueva llave.
**—** \`${generatedCode}\`.
**—** ID: \`${generatedID}\`.`)
      .setColor(Colores.verde)

      return message.channel.send(added);

  } else {
    return message.channel.send(embed);
  }

    function generateCode(){
        // generar nueva key
        let chr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let generatedCode = "";

        for (let i = 0; i < 19; i++) {
            // ABCD-EFGH-IJKL-MNOP
            // 0123 5678 9101112 14151617
            if(generatedCode.length == 4 || generatedCode.length == 9 || generatedCode.length == 14) generatedCode += "-"
            else {
                generatedCode += chr.charAt(Math.floor(Math.random() * chr.length));
            }
        }

        return generatedCode;
    }

    async function findKey(key){
        let q = await Key.findOne({
            code: key
        });

        return q ? true : false;
    }

}

module.exports.help = {
    name: "redeem",
    alias: "key"
}
