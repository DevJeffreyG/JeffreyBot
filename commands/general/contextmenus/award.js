const { ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageContextMenuCommandInteraction, Client, hyperlink, codeBlock } = require("discord.js");
const { Colores } = require("../../../src/resources");
const { ContextMenu, Embed, Confirmation, ErrorEmbed, Log, LogReasons, ChannelModules, GetRandomItem, PrettyCurrency } = require("../../../src/utils");

const ms = require("ms");
const { EconomyError, FetchError, ExecutionError } = require("../../../src/errors");

const command = new ContextMenu({
    name: "Dar Award",
    type: ApplicationCommandType.Message
})

/**
 * 
 * @param {MessageContextMenuCommandInteraction} interaction 
 * @param {*} models 
 * @param {*} params 
 * @param {Client} client 
 */
command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const { message } = params;
    const { Users } = models;

    const { Tier1, Tier2, Tier3 } = client.Emojis;

    // Definir el tipo de tier
    const tierRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("awardT1")
                .setEmoji(Tier1)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("awardT2")
                .setEmoji(Tier2)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("awardT3")
                .setEmoji(Tier3)
                .setStyle(ButtonStyle.Secondary),
        )

    const msg = await interaction.editReply({
        embeds: [
            new Embed()
                .defTitle("¿Cuál es el premio?")
                .defDesc(`Selecciona el premio que deseas darle al ${hyperlink("mensaje", message.url)}.`)
                .defColor(Colores.verde)
                .defFooter({ text: "Puedes ignorar este mensaje para no dárselo." })
        ], components: [tierRow]
    });

    const filter = (inter) => inter.user.id === interaction.user.id;

    const component = await msg.awaitMessageComponent({ filter, time: ms("1m") }).catch(err => { });
    if (!component) return;

    component.deferUpdate();

    const doc = params.getDoc();
    const user = params.getUser();
    const message_user = await Users.getWork({ user_id: message.author.id, guild_id: interaction.guild.id });

    const hall = await interaction.guild.channels.fetch(doc.getChannel("general.halloffame")).catch(err => { });
    if (!hall) {
        new Log(interaction)
            .setReason(LogReasons.Error)
            .setTarget(ChannelModules.StaffLogs)
            .send({
                embeds: [
                    new ErrorEmbed()
                        .defDesc(`**No se pudo encontrar el canal configurado para los Awards.**`)
                ]
            })

        throw new FetchError(interaction, "canal", [
            "No hay ningún canal de premios configurado",
            "No se puede enviar el mensaje",
            "Avísa a los Administradores"
        ])
    }

    const tierNum = component.customId.slice(-1)
    const quantityProperty = `tier${tierNum}`;
    const { price, gift } = doc.settings.quantities.awards[quantityProperty]

    const confirmation = await Confirmation("Dar premio", [
        `Esto serán ${PrettyCurrency(interaction.guild, price)}`,
        `El autor del mensaje recibirá ${PrettyCurrency(interaction.guild, gift)}`,
        `Tienes ${PrettyCurrency(interaction.guild, user.getCurrency())}`,
        `Se enviará un mensaje a ${hall}.`
    ], interaction)
    if (!confirmation) return;

    if (!user.canBuy(price)) throw new EconomyError(interaction, "No tienes tanto dinero", user.getCurrency());

    const hallEmbed = new Embed();
    const star = hyperlink("★", message.url);
    let content = message.content;

    // Tiene attachments
    if (message.attachments.size !== 0) {
        const firstAttachment = message.attachments.first();
        content = `${message.content} ${hyperlink("archivo", firstAttachment.url)}`;

        hallEmbed.setImage(firstAttachment.url);
    } else if (message.embeds.length != 0) { // El mensaje tiene embeds
        let firstEmbed = message.embeds[0];

        if (!firstEmbed.video && firstEmbed.url) { // es una imagen
            hallEmbed.setImage(firstEmbed.url)
            content = firstEmbed.url;
        } else if (firstEmbed.video && !firstEmbed.thumbnail) { // es un link, que general un video reproducible
            content = firstEmbed.url + "\n(vídeo)";
        } else if (firstEmbed.video && firstEmbed.thumbnail) { // es un gif
            hallEmbed.setImage(firstEmbed.thumbnail.url)
            content = firstEmbed.url;
        } else { // cualquier otra cosa
            let incaseofField = "";

            firstEmbed.fields.forEach(function (field) {
                incaseofField += `\n${field.name} ${field.value}`
            });

            content = firstEmbed.description ?? incaseofField;
        }
    } else if (message.system) content = "[ Mensaje de sistema ]";

    let titulos = [
        "Una vez una fuente de sabiduría dijo:",
        "Y entonces la verdad habló y dijo:",
        "La verdad se dijo, y fue:",
        "Fue cuando la verdad se alzó:"
    ]

    let text = GetRandomItem(titulos);

    hallEmbed.defAuthor({ text, icon: client.EmojisObject[`Tier${tierNum}`].url });
    hallEmbed.defDesc(`${star} ${content}`);
    hallEmbed.defColor(message.member.displayHexColor);
    hallEmbed.defFooter({ text: `Mensaje por ${message.author.username}・Premio de Tier ${tierNum} por ${interaction.user === message.author ? `ellos mismos, ${interaction.user.username}` : interaction.user.username}`, icon: message.author.displayAvatarURL({ dynamic: true }) });

    // Pagar
    if (user.user_id === message_user.user_id) {
        user.addCurrency((-price) + gift);
    } else {
        user.economy.global.currency -= price;
        message_user.addCurrency(gift);
        await user.save();
    }

    // Enviar mensaje
    try {
        await hall.send({ embeds: [hallEmbed] });
    } catch (err) {
        new Log(interaction)
            .setReason(LogReasons.Error)
            .setTarget(ChannelModules.StaffLogs)
            .send({
                embeds: [
                    new ErrorEmbed()
                        .defDesc(`**No se pudo enviar el mensaje al canal de los Awards.**${codeBlock("json", err)}`)
                ]
            });

        new ExecutionError(interaction, [
            "No se pudo enviar el mensaje al canal",
            "El autor del mensaje **sí** recibió el precio",
            "Avísa a los Administradores"
        ]).send({ ephemeral: true, followup: true })
        .catch(e => console.error(e))
    }

    return interaction.editReply({
        embeds: [
            new Embed({
                type: "success",
                data: {
                    desc: "Pagado"
                }
            })
        ]
    });
}

module.exports = command;