const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
  name: "add-jeffros",
  aliases: ["addjeffros", "addj"],
  info: `Añades Jeffros o DarkJeffros a un usuario. **!** Agregar DarkJeffros a un usuario sin estos, hará que no se genere un \`dsDJDuration\``,
  params: [
      {
        name: "miembro", type: "Member", optional: false
      },
      {
        name: "a añadir", display: `N° ${Emojis.Jeffros}/${Emojis.Dark}`, type: "Number", optional: false
      },
      {
        name: "darkjeffros?", type: "Boolean", optional: true
      }
  ],
  userlevel: "DEVELOPER",
  category: "DEVELOPER"
}

module.exports = {
  data: commandInfo,
  async execute(client, message, args){
    const { guild, author, prefix, executionInfo } = await Initialize(client, message);

    let response = await TutorialEmbed(commandInfo, executionInfo, args);
  
    if(response[0] === "ERROR") return console.log(response); // si hay algún error
  
    // Comando
    
    const member = response.find(x => x.param === "miembro").data;
    const jeffrosToAdd = response.find(x => x.param === "a añadir").data;
    const isDark = response.find(x => x.param === "darkjeffros?").data;
  
    const user = await User.findOne({
      user_id: member.id,
      guild_id: guild.id
    }) ?? await new User({
        user_id: member.id,
        guild_id: guild.id
    }).save();
  
    if(isDark){
      if(!user.economy.dark.darkjeffros) return message.reply("No ha cambiado por primera vez DarkJeffros, abortando porque no se puede generar una duración de DarkJeffros.");
      user.economy.dark.darkjeffros += jeffrosToAdd;
    } else {
      user.economy.global.jeffros += jeffrosToAdd;
    }
  
    await user.save();
    let embed = new Discord.MessageEmbed()
    .setAuthor(`¡${isDark ? "DarkJeffros" : "Jeffros"} para ti, ${member.user.tag}!`, member.user.displayAvatarURL())
    .setDescription(`
  **+${isDark ? Emojis.Dark : Emojis.Jeffros}${jeffrosToAdd.toLocaleString('es-CO')}
  — ${isDark ? Emojis.Dark : Emojis.Jeffros}${isDark ? user.economy.dark.darkjeffros.toLocaleString('es-CO') : user.economy.global.jeffros.toLocaleString('es-CO')}**`)
    .setColor(Colores.verde)
    .setThumbnail(guild.iconURL());
  
    return message.channel.send({embeds: [embed]});
  }
}