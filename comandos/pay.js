const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (client, message, args) => {
  if (!message.content.startsWith(prefix)) return;
  
  // Variables
  let author = message.author;
  const guild = message.guild;

  let embed = new Discord.MessageEmbed()
    .setTitle(`Ayuda: ${prefix}pay`)
    .setColor(Colores.nocolor)
    .setDescription(
      `▸ El uso correcto es: ${prefix}pay <@usuario || ID> <${Emojis.Jeffros}> \n▸ Le pagas/das Jeffros a un usuario.`
    )
    .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}pagar`);

  var user = message.guild.member(
    message.mentions.users.first() || message.guild.members.cache.get(args[0])
  );
  if (!user) return message.channel.send(embed);

  let toPay = Math.floor(args[1]);
  if (!toPay) return message.channel.send(embed);
  if (isNaN(toPay)) return message.channel.send(embed);
  if (toPay<1) return message.channel.send(embed);
  
  if(user.id === author.id){ // te autopagas
    let paidE = new Discord.MessageEmbed()
        .setAuthor(`| Hecho`, Config.bienPng)
        .setDescription(
          `**${author}** le pagó **${Emojis.Jeffros}${toPay}** a... **que**.`
        )
        .setColor(Colores.verde);
    
    return message.channel.send(paidE);
  }

  Jeffros.findOne(
    {
      userID: user.id
    },
    (err, uPay) => {
      if (err) throw err;

      let errorEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Error`, Config.errorPng)
        .setDescription(
          `¡No tienes tantos Jeffros!
*Usa \`${prefix}stats\` para ver cuántos Jeffros tienes.*`
        )
        .setColor(Colores.rojo);

      let niceEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Hecho`, Config.bienPng)
        .setDescription(
          `**${author}** le pagó **${Emojis.Jeffros}${toPay}** a **${user}**.`
        )
        .setColor(Colores.verde);

      Jeffros.findOne(
        {
          userID: author.id
        },
        (err2, uBy) => {
          if (err2) throw err2;

          if (!uBy) return message.channel.send(errorEmbed);

          if (uBy.jeffros < toPay) return message.channel.send(errorEmbed);

          if (!uPay) {
            const newJeffros = new Jeffros({
              userID: user.id,
              serverID: guild.id,
              jeffros: toPay
            });

            uBy.jeffros -= toPay;

            uBy.save();
            newJeffros.save();

            return message.channel.send(niceEmbed);
          }

          uPay.jeffros += toPay;
          uBy.jeffros -= toPay;

          uPay.save();
          uBy.save();

          return message.channel.send(niceEmbed);
        }
      );
    }
  );
};

module.exports.help = {
  name: "pay",
  alias: "pagar"
};
