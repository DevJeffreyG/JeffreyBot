const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;

const ytdl = require("ytdl-core");

// me encuento en estado de depresion
const { joinVoiceChannel, createAudioPlayer, createAudioResource, demuxProbe, NoSubscriberBehavior, getNextResource, VoiceConnectionStatus, AudioPlayerStatus, generateDependencyReport } = require('@discordjs/voice');

module.exports.run = async (client, message, args, active) => {

  if(message.author.id != jeffreygID) return;
  let member = message.member;
    let channel = member.voice.channel;

    // guardar datos de la canción
    let videoID = await ytdl.getURLVideoID(args[0])
    let info = await ytdl.getInfo(videoID);

    // CREAR AUDIORESOURSE, PARA PODER REPRODUCIRLO AL VC
    /* let music = createAudioResource(ytdl(args[0], {
        filter: "audioonly",
        highWaterMark: 1048576 / 4
    }));
     */

    let url = args[0]

    const stream = ytdl(url, { filter: 'audioonly', format: 'webm' })
    const probe = await demuxProbe(stream)
    let music = createAudioResource(probe.stream, { metadata: url, inputType: probe.type })

    const player = createAudioPlayer({ // hacer lo que sea que playee la musica
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });

    const connection = await joinVoiceChannel({ // unirse al canal
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    connection.subscribe(player); // SUSCRIBIRSE AL PLAYER PQ SINO SE MUERE

    player.play(music)

    player.on(AudioPlayerStatus.Playing, (oldState, newState) => {
        // reproduciendo algo
        let reproduciendoEmbed = new Discord.MessageEmbed()
        .setDescription(
            `🎶 | **Reproduciendo: \`${info.videoDetails.title}\`, pedido por: ${message.author.tag}**`
        )
        .setColor(Colores.verde);
        message.channel.send({embeds: [reproduciendoEmbed]});
    });

    player.on('error', error => {
        console.log(error)
        setTimeout(() => player.unpause(), 5000);
        //console.log(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
    });
};

module.exports.help = {
  name: "newplay"
};
