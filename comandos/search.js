const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;

const ytdl = require("ytdl-core");
const search = require("yt-search");

module.exports.run = async (bot, message, args, active) => {
  if (!message.content.startsWith(prefix)) return;

  let sadface = new Discord.MessageEmbed()
  .setAuthor(`| Error`, Config.errorPng)
  .setColor(Colores.rojo)
  .setDescription(`Los comandos de música de Jeffrey Bot están desactivados debido a problemas con el host.\n[▸ Anuncio](https://discordapp.com/channels/447797737216278528/485191462422577182/733704080714629160)`)
  //return message.channel.send(sadface)

  // Variables
  let author = message.author;
  const guild = message.guild;
  let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
  let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

  console.log(author.tag);

  let searchEmbed = new Discord.MessageEmbed().setColor(Colores.verde);
  
    let errorE1 = new Discord.MessageEmbed()
    .setAuthor(`| Error: 1`, Config.errorPng)
    .setDescription(`Algo ha salido mal, no he encontrado resultados. Prueba otra vez o llama a Jeffrey.`)
    .setColor(Colores.rojo);

  search(args.join(" "), function(err, res) {
    console.log(err);
    console.log(res)
    if (err) throw err;
    let videos = res.videos.slice(0, 10);

    if(videos.length === 0){
      console.log(args.join(" "))
       return message.channel.send(errorE1)
    
      }
    
    let resp = "";
    for (var i in videos) {
      resp += `**${parseInt(i) + 1} — [${
        videos[i].title
      }](https://www.youtube.com${videos[i].url})** \`(${
        videos[i].timestamp
      })\`\n`;
    }

    searchEmbed.setDescription(resp);
    searchEmbed.setFooter(`▸ Elige un número entre 1-${videos.length}`);

    message.channel.send(searchEmbed);

    const filter = m =>
      !isNaN(m.content) && m.content < videos.length + 1 && m.content > 0;

    const collector = message.channel.createMessageCollector(filter);

    // actualizar las variables del collector
    collector.videos = videos;

    //listener
    collector.on("collect", function(m) {
      if (m.author.tag != author.tag) {
        // si no es el autor original, no hacer nada
      } else {
        /*if (isNaN(m.content)) {
          console.log("pole");
          return collector.stop();
        }*/
        //run play command

        let commandFile = require("./play.js");
        commandFile.run(
          bot,
          message,
          [this.videos[parseInt(m.content) - 1].url],
          active
        );
        return collector.stop();
      }
    });
  });
};

module.exports.help = {
  name: "search"
};
