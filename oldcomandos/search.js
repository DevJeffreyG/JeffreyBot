const Config = require("./../src/resources/base.json");
const Colores = require("./../src/resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const search = require("yt-search");

module.exports.run = async (client, message, args, active) => {
  if (!message.content.startsWith(prefix)) return;

  let sadface = new Discord.EmbedBuilder()
  .setAuthor(`| Error`, Config.errorPng)
  .setColor(Colores.rojo)
  .setDescription(`Los comandos de música de Jeffrey Bot están desactivados debido a problemas con el host.\n[▸ Anuncio](https://discordapp.com/channels/447797737216278528/485191462422577182/733704080714629160)`)
  //return message.channel.send({embeds: [sadface]})

  // Variables
  let author = message.author;
  const guild = message.guild;

  console.log(author.tag);

  let searchEmbed = new Discord.EmbedBuilder().setColor(Colores.verde);
  
    let errorE1 = new Discord.EmbedBuilder()
    .setAuthor(`| Error: 1`, Config.errorPng)
    .setDescription(`Algo ha salido mal, no he encontrado resultados. Prueba otra vez o llama a Jeffrey.`)
    .setColor(Colores.rojo);

  search(args.join(" "), function(err, res) {
    if (err) throw err;
    let videos = res.videos.slice(0, 10);

    if(videos.length === 0){
      console.log(args.join(" "))
       return message.channel.send({embeds: [errorE1]})
    
      }
    
    let resp = "";
    for (var i in videos) {
      resp += `**${parseInt(i) + 1} — [${
        videos[i].title
      }](${videos[i].url})** \`(${
        videos[i].timestamp
      })\`\n`;
    }

    searchEmbed.setDescription(resp);
    searchEmbed.setFooter(`▸ Elige un número entre 1-${videos.length}`);

    message.channel.send({embeds: [searchEmbed]});

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
          client,
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
