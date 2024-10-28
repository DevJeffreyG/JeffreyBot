const { Command, Embed, importImage, FindNewId } = require("../../utils")
const { Colores } = require("../../resources")

const ms = require("ms");
const moment = require("moment-timezone");
const Chance = require("chance");

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, time, BaseGuildTextChannel } = require("discord.js");
const { BadParamsError } = require("../../errors");

const command = new Command({
    name: "encuesta",
    desc: "Crea una encuesta donde los usuarios responden una pregunta de sí o no"
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

command.addOption({
    type: "channel",
    name: "canal",
    desc: "El canal donde se va a enviar la encuesta",
    req: true
})

command.addOption({
    type: "mentionable",
    name: "mencion",
    desc: "Mención incluida en el mensaje de la encuesta"
})

command.execute = async (interaction, models, params, client) => {

    await interaction.deferReply();
    const { duracion, encuesta, mencion, canal } = params;
    const { GlobalDatas } = models;

    const mention = mencion?.role ?? "";
    const duration = ms(duracion.value) || Infinity;
    const poll = encuesta.value;

    const guild = interaction.guild;
    const channel = canal.channel;
    const timestamp = duration >= ms("1m") && !isNaN(duration) ? moment().add(duration, "ms").toDate() : null;
    const image = importImage("vota");

    if (!timestamp)
        throw new BadParamsError(interaction, "La duración debe ser mayor o igual a 1 minuto");

    if (!(channel instanceof BaseGuildTextChannel))
        throw new BadParamsError(interaction, ["El `canal` debe ser un canal de texto"]);

    let imgEmbed = new Embed()
        .defImage(image.attachment)
        .defColor(Colores.verdejeffrey)

    const footer = new Chance().pickone([
        "¡Anímate, cada voto cuenta!",
        "¡Vota aquí abajo!",
        "¡Anímate a votar!",
        "¡El STAFF necesita tu opinión!",
        "¡Es tu momento de opinar!"
    ])

    let embed = new Embed()
        .defAuthor({ text: `¡Nueva encuesta del STAFF!`, title: true })
        .defDesc(`### Encuesta:\n> ${poll}`)
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

    let msg = await channel.send({
        content: mention.toString(),
        embeds: [imgEmbed, embed],
        files: [image.file],
        components: [row],
        allowedMentions: {
            parse: [
                'roles',
                'everyone'
            ]
        }
    })
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