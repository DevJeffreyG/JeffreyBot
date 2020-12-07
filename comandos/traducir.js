const Config = require("./../base.json");
const Colores = require("./../colores.json");
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
const translate = require("translate-google");

exports.run = async (bot, message, args) => {
    return;
  let BRIGGS = message.guild.member("450453034724491266");

    var embed = new Discord.MessageEmbed()
    .setDescription(`${Config.prefix}traducir <lenguaje al que se traduce> $ <texto>\n_ _\n**—** [Ver todos los lenguajes](https://github.com/shikar/NODE_GOOGLE_TRANSLATE/blob/master/languages.js)`)
    .setColor(Colores.rojo);
    
    if (!args.includes("$")) {
        console.log("no $");
        message.channel.send(embed);
    } else {
        var toTranslate = args.join(" ").slice(5)
        var lang = args[0].toString();
        translate(toTranslate, { to: lang })
            .then(res => {
                let correctEmbed = new Discord.MessageEmbed()
                .setDescription(`${res}`)
                .setColor(`#66a0ff`)
                .setFooter(`Para ${message.author.tag} | Creado con ayuda de ${BRIGGS.user.tag}.`);
                message.channel.send(correctEmbed);
            })
            .catch(err => {
                console.log(err);
                message.channel.send(embed);
            })
    }

}

module.exports.help = {
    name: "traducir",
    alias: "translate"
}