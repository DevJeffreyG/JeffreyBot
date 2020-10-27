const Config = require("./../base.json");
const Colores = require("./../colores.json");
const reglas = require("./../reglas.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;
const logChannel = Config.logChannel;
const version = Config.version;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Reporte = require("../modelos/reporte.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Banned = require("../modelos/banned.js");
const SoftWarn = require("../modelos/softwarn.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
  let logC = guild.channels.cache.find(x => x.id === logChannel);
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}pardon`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}pardon <@usuario> (N° de Warns a restar.) (n°regla en softwarn)`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}unwarn`);

  var size = Object.keys(reglas).length;

  let rulesEmbed = new Discord.MessageEmbed()
  .setColor(Colores.nocolor)
  .setDescription(`▸ Usa el comando como \`${prefix}pardon <@usuario> (N° de Warns a restar.) (N° Regla)\`.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}swarn`);
  //agregar cada regla de la variable de reglas
  for(let i = 1; i <= size; i++){
      rulesEmbed.addField(reglas[i], `N° **${i}**`);
  }
  
  let wUser = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
  let numW;
  let softW = args[2] || undefined;

  if(!wUser) return message.channel.send(embed);
  
  if(!args[1]){
    numW = 1;
  } else {
    numW = args[1];
  }
  
  if(message.member.roles.cache.find(x => x.id === jeffreyRole.id)){} else if(message.member.roles.cache.find(x => x.id === adminRole.id)){} else if(message.member.roles.cache.find(x => x.id === modRole.id)){} else {return;}
  let rule = reglas[softW] || "na";
  if(rule === "na") return message.channel.send(rulesEmbed);

  if(softW){
    SoftWarn.findOne({
      userID: author.id,
      "warns.rule": rule
    }, (err, soft) => {
      if(err) throw err;

      if(!soft) return message.reply("No encontré ese softwarn registrado en este usuario.")

      if(soft.warns.length > 1){
        let indexS = soft.warns.findIndex(x => x.rule === rule);

        soft.warns.splice(indexS);
        soft.save();
      } else {
        soft.remove()
      }
    })
  } else {
    Warn.findOne({
      userID: wUser.id
    }, (err, warns) => {
      if(err) throw err;
      
      if(!warns || warns.warns === 0 || warns.warns-numW <= -1){
        return;
      } else {
        warns.warns = warns.warns - numW;
        warns.save().then(x => message.react("✅"))
        .catch(e => console.log(e));
        
        let wEmbed = new Discord.MessageEmbed()
        .setAuthor(`| ¿Me perd0nas?`, "https://cdn.discordapp.com/emojis/537004318667177996.png")
        .setDescription(`**—** Miembro: ${wUser}
  **—** Warns actuales: **${warns.warns}**.
  **—** Mod: ${author}`)
        .setColor(Colores.verde);

        logC.send(wEmbed);
        
        let unwarnedEmbed = new Discord.MessageEmbed()
            .setAuthor(`| Pardon`, "https://cdn.discordapp.com/emojis/537004318667177996.png")
            .setDescription(`
  **—** Has sido perdonado. =)
  **—** Warns actuales: **${warns.warns}**.`)
            .setColor(Colores.verde)
            .setFooter(`Tienes suerte.`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
            
            wUser.send(unwarnedEmbed)
            .catch(e => {
              console.log('Tiene los MDs desactivados.')
            });
      }
    })
  }
}

module.exports.help = {
    name: "pardon",
    alias: "unwarn"
}
