const { Command, Embed, importImage, FindNewId } = require("../../src/utils")
const { Config, Colores } = require("../../src/resources")

const ms = require("ms");
const moment = require("moment");

const command = new Command({
    name: "sencuesta",
    desc: "Encuesta que se pone fuera de las encuestas hechas por la comunidad en el canal de anuncios",
    category: "STAFF"
})

command.addOption({
    type: "string",
    name: "duracion",
    desc: "La duración que va a tener la encuesta para recibir respuestas",
    req: true
})

command.addOption({
    type: "string",
    name: "anuncio",
    desc: "La encuesta en sí",
    req: true
})

command.execute = async (interaction, models, params, client) => {

    await interaction.deferReply();
    const { duracion, anuncio } = params;
    const { GlobalDatas } = models;
    const duration = ms(duracion.value) || Infinity;
    const poll = anuncio.value;

    const guild = interaction.guild;
    const channel = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "483007967239602196") : guild.channels.cache.find(x => x.id === Config.announceChannel);
    const timestamp = duration != Infinity ? moment().add(duration, "ms").toDate() : null;
    const image = importImage("vota");

    let imgEmbed = new Embed()
    .setImage(image.attachment)
    .defColor(Colores.verdejeffrey)

    let embed = new Embed()
    .defAuthor({text: `¡Nueva encuesta del STAFF!`, title: true})
    .defDesc(poll)
    .defColor(Colores.verdeclaro)
    .defFooter({text: `PUEDES VOTAR HASTA`})

    if(timestamp) embed.setTimestamp(timestamp);
    else embed.defFooter({text: `Vota aquí abajo ⬇️`})

    let msg = await channel.send({embeds: [imgEmbed, embed], files: [image.file]});
    //let msg = await channel.send({embeds: [embed]});
    let pollId = await FindNewId(await GlobalDatas.find({"info.type": "temporalPoll", "info.guild_id": guild.id}), "info", "id");

    await new GlobalDatas({
        info: {
            type: "temporalPoll",
            guild_id: guild.id,
            channel_id: channel.id,
            message_id: msg.id,
            until: timestamp,
            id: pollId
        }
    }).save();

    await interaction.editReply("✅ Listo")

    await msg.react("✅");
    await msg.react("❌");

}

module.exports = command;