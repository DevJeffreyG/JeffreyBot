const { TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, time, TimestampStyles, BaseGuildTextChannel, DiscordjsErrorCodes } = require("discord.js");
const { Command, Categories, Modal, Embed, ProgressBar } = require("../../utils");
const ms = require("ms");
const moment = require("moment-timezone");
const { Colores } = require("../../resources");
const { BadParamsError } = require("../../errors");

const command = new Command({
    name: "apuesta",
    desc: "Crea una nueva apuesta para los usuarios del servidor",
    category: Categories.Staff
})

command.addOption({
    type: "string",
    name: "titulo",
    desc: "A qué se va a apostar",
    req: true
})

command.addOption({
    type: "string",
    name: "tiempo",
    desc: "El tiempo que estará abierta la apuesta",
    req: true
})

command.addOption({
    type: "channel",
    name: "canal",
    desc: "El canal donde se va a enviar la apuesta",
    req: true
})

command.addOption({
    type: "mentionable",
    name: "mencion",
    desc: "Mención incluida en el mensaje de la apuesta"
})

command.execute = async (interaction, models, params, client) => {
    if (ms(params.tiempo.value) < ms("1m")) {
        await interaction.deferReply();
        throw new BadParamsError(interaction, "`tiempo` debe ser mayor o igual a 1 minuto");
    }

    const doc = params.getDoc();
    const closes_in = moment().add(ms(params.tiempo.value), "ms").toDate();
    const modal = new Modal(interaction)
        .defTitle("Nueva apuesta")
        .defUniqueId("betCreation");

    for (let i = 0; i < 5; i++) {
        modal.addInput({
            id: String(i),
            label: `Opción ${i + 1}`,
            placeholder: `Un posible resultado a la apuesta`,
            style: TextInputStyle.Short,
            max: 80,
            min: 1,
            req: i < 2
        })
    }

    await modal.show()
    let r = await interaction.awaitModalSubmit({
        filter: (i) => i.customId === modal.customId && i.userId === interaction.userId,
        time: ms("5m")
    }).catch(async err => {
        if (err.code === DiscordjsErrorCodes.InteractionCollectorError) await interaction.deleteReply();
        else throw err;
    });
    if (!r) return;
    await r.deferReply();

    const row = new ActionRowBuilder();
    const options = new Modal(r).read();

    let emojis = [
        "🔴", "🟣", "🟢", "🟡", "🟠"
    ]

    let squares = [
        "🟥", "🟪", "🟩", "🟨", "🟧"
    ]

    let optionsObj = [];
    let embed = new Embed()
        .defTitle(`Apuesta del STAFF`)
        .defDesc(`# ${params.titulo.value}\n### Las apuestas se cierran ${time(closes_in, TimestampStyles.RelativeTime)}
## ${ProgressBar(0)}`)
        .defColor(Colores.verdejeffrey)

    for (const prop in options) {
        const value = options[prop];
        const emoji = emojis.splice(0, 1)[0];
        const square = squares.splice(0, 1)[0];

        optionsObj.push({
            name: value,
            emoji,
            square,
            betting: []
        });

        embed.defField(`${emoji} ${value}`, "Usuarios: 0");

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`betOption-${prop}`)
                .setLabel(value)
                .setStyle(ButtonStyle.Primary)
                .setEmoji(emoji)
        )
    }

    const channel = params.canal.channel;
    const mention = params.mencion?.role ?? "";

    if (!(channel instanceof BaseGuildTextChannel))
        throw new BadParamsError(interaction, ["El `canal` debe ser un canal de texto"]);

    await r.editReply({ embeds: [new Embed({ type: "success" })] });
    let msg = await channel.send({
        content: mention.toString(),
        embeds: [embed],
        components: [row],
        allowedMentions: {
            parse: [
                'roles',
                'everyone'
            ]
        }
    })

    doc.data.bets.push({
        title: params.titulo.value,
        closes_in,
        options: optionsObj,
        message_id: msg.id,
        channel_id: channel.id
    })

    await doc.save();
}

module.exports = command;