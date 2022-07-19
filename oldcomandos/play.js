const Config = require("./../src/resources/base.json");
const Colores = require("./../src/resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

const ytdl = require("ytdl-core");

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

  // embeds

  let errorE1 = new Discord.EmbedBuilder()
    .setAuthor(`| Error: 1`, Config.errorPng)
    .setDescription(`Por favor, conéctate a un canal de voz.`)
    .setColor(Colores.rojo);

  let errorE2 = new Discord.EmbedBuilder()
    .setAuthor(`| Error: 2`, Config.errorPng)
    .setDescription(`Lo siento, ya estoy conectado al canal de voz.`)
    .setColor(Colores.rojo);

  let errorE3 = new Discord.EmbedBuilder()
    .setAuthor(`| Error: 3`, Config.errorPng)
    .setDescription(`Por favor usa una url seguida del comando.`)
    .setColor(Colores.rojo);

  let errorE4 = new Discord.EmbedBuilder()
    .setAuthor(`| Error: 4`, Config.errorPng)
    .setDescription(`Por favor, usa un url **válida** seguida del comando.`)
    .setColor(Colores.rojo);

  // author está en el canal?
  if (!message.member.voice) return message.channel.send({embeds: [errorE1]});

  let pFetched = active.get(guild.id);

  // se dió la url?
  if (!args[0] && !pFetched) {
    return message.channel.send({embeds: [errorE3]});
  } else if(pFetched){
    if (pFetched.dispatcher.paused) {
      let commandFile = require("./resume.js");
      commandFile.run(client, message, args, active);
    }
  }

  // validar info
  let validate = await ytdl.validateURL(args[0]);

  if (!validate || !args[0]) {
    let commandFile = require("./search.js");
    return commandFile.run(client, message, args, active);
  }

  //definir info
  let videoID = await ytdl.getURLVideoID(args[0])
  let info = await ytdl.getInfo(videoID);
  // fetch al active
  let data = active.get(message.guild.id) || {};

  // update data
  if (!data.connection)
    data.connection = await message.member.voice.channel.join(); // si no hay conexion crear una.
  if (!data.queue) data.queue = []; // si no hay un array de queue crear una.
  data.guildID = guild.id; // nunca se resetea, entonces poner encualquier momento en cuando se use el comando.

  //añadir cancion a la cola
  data.queue.push({
    songTitle: info.videoDetails.title,
    requester: author.tag,
    url: args[0],
    announceChannel: message.channel.id
  });

  // si no hay un dispatcher creado, funcion play()
  if (!data.dispatcher) play(client, active, data);
  else {
    // pero, si ya existe
    let addQueue = new Discord.EmbedBuilder()
      .setDescription(
        `***️⃣ | Añadido a la cola: \`${info.videoDetails.title}\`, pedido por: ${author.tag}**`
      )
      .setColor(Colores.verde);
    message.channel.send({embeds: [addQueue]});
  }

  // actualizar el Map();

  active.set(guild.id, data);

  async function play(client, active, data) {
    let reproduciendoEmbed = new Discord.EmbedBuilder()
      .setDescription(
        `🎶 | **Reproduciendo: \`${data.queue[0].songTitle}\`, pedido por: ${data.queue[0].requester}**`
      )
      .setColor(Colores.verde);
    client.channels.cache.get(data.queue[0].announceChannel).send({embeds: [reproduciendoEmbed]});
    // actualizar la info del dispatcher
    data.dispatcher = await data.connection.play(
      await ytdl(data.queue[0].url), { type: 'opus' }
    );

    data.dispatcher.guildID = data.guildID;

    //crear un listener que se active cuando la canción termine

    data.dispatcher.once("finish", function() {
      finish(client, active, this);
    });
  }

  function finish(client, active, dispatcher) {
    let fetched = active.get(dispatcher.guildID);

    // eliminar primer item en cola
    fetched.queue.shift();
    setTimeout(function() {
      // revisar si la cola está vacia
      if (fetched.queue.length > 0) {
        // si no
        //update map con la nueva cola
        active.set(dispatcher.guildID, fetched);
        // play function para que empiece la cancion siguiente
        play(client, active, fetched);
      } else {
        // si la cola está vacia
        //eliminar el objeto guild
        active.delete(dispatcher.guildID);
        let vc = client.guilds.cache.get(dispatcher.guildID).me.voice.channel;

        let finEmbed = new Discord.EmbedBuilder()
          .setDescription(
            `Se ha acabado la cola. ¡Gracias por el show, saliendo del chat de voz...!`
          )
          .setColor(Colores.verde);

        if (vc) vc.leave();
        message.channel.send({embeds: [finEmbed]});
      }
    }, 2000);
  }
};

module.exports.help = {
  name: "play"
};
