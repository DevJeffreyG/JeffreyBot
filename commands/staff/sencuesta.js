const { Command, Categories, Embed, importImage, FindNewId, GetRandomItem, ErrorEmbed } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const ms = require("ms");
const moment = require("moment-timezone");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, time } = require("discord.js");

const command = new Command({
    name: "sencuesta",
    desc: "Encuesta que se pone fuera de las encuestas hechas por la comunidad en el canal de anuncios",
    category: Categories.Staff
})

command.addOption({
    type: "string",
    name: "duracion",
    desc: "La duración que va a tener la encuesta para recibir respuestas. (1d, 30m, etc)",
    req: true
})

command.addOption({
    type: "string",
    name: "encuesta",
    desc: "¿Cuál es la encuesta para hacerle a los usuarios?",
    req: true
})

command.execute = async (interaction, models, params, client) => {

    await interaction.deferReply();
    const { duracion, encuesta } = params;
    const { GlobalDatas } = models;

    const doc = params.getDoc();

    const duration = ms(duracion.value) || Infinity;
    const poll = encuesta.value;

    const guild = interaction.guild;
    const channel = interaction.guild.channels.cache.get(doc.getChannel("general.announcements"));
    const timestamp = duration > ms("1m") && !isNaN(duration) ? moment().add(duration, "ms").toDate() : null;
    const image = importImage("vota");

    if (!timestamp) return new ErrorEmbed(interaction, {
        type: "badParams", data: {
            help: "La duración debe ser mayor o igual a 1 minuto"
        }
    }).send();

    let imgEmbed = new Embed()
        .setImage(image.attachment)
        .defColor(Colores.verdejeffrey)

    const footer = GetRandomItem([
        "¡Anímate, cada voto cuenta!",
        "¡Vota aquí abajo!",
        "¡Anímate a votar!",
        "¡El STAFF necesita tu opinión!",
        "¡Es tu momento de opinar!"
    ])

    let embed = new Embed()
        .defAuthor({ text: `¡Nueva encuesta del STAFF!`, title: true })
        .defField("Encuesta:", poll)
        .defColor(Colores.verdeclaro)
        .defFooter({ text: footer })
        .setTimestamp(timestamp)
        .defField("Vota hasta...", `${time(timestamp)} (${time(timestamp, "R")})`);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("yesPoll")
                .setEmoji(client.Emojis.Check)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("noPoll")
                .setEmoji(client.Emojis.Cross)
                .setStyle(ButtonStyle.Danger),
        )

    let msg = await channel.send({ embeds: [imgEmbed, embed], files: [image.file], components: [row] })
    //let msg = await channel.send({embeds: [embed]});
    let pollId = FindNewId(await GlobalDatas.find({ type: "temporalPoll", "info.guild_id": guild.id }), "info", "id");

    await new GlobalDatas({
        type: "temporalPoll",
        info: {
            poll,
            guild_id: guild.id,
            channel_id: channel.id,
            message_id: msg.id,
            until: timestamp,
            id: pollId,
            yes: [],
            no: []
        }
    }).save();

    await interaction.editReply({
        embeds: [
            new Embed({
                type: "success",
                data: {
                    desc: "Se creó la encuesta"
                }
            })
        ]
    })
}

module.exports = command;