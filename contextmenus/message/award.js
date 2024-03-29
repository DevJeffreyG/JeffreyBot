const { ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageContextMenuCommandInteraction, Client, hyperlink, codeBlock } = require("discord.js");
const { Colores } = require("../../src/resources");
const { ContextMenu, Categories, Embed, Confirmation, ErrorEmbed, Log, LogReasons, ChannelModules, GetRandomItem } = require("../../src/utils");

const ms = require("ms")

const command = new ContextMenu({
    name: "Dar Award",
    type: ApplicationCommandType.Message,
    category: Categories.Fun
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
    const CustomEmojis = client.getCustomEmojis(interaction.guild.id);
    const { Currency } = CustomEmojis

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
    const message_user = await Users.getOrCreate({ user_id: message.author.id, guild_id: interaction.guild.id });

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

        return new ErrorEmbed(interaction, {
            type: "execError",
            data: {
                guide: "No hay un canal de premios configurado, avísale a los Administradores."
            }
        }).send()
    }

    const tierNum = component.customId.slice(-1)
    const quantityProperty = `tier${tierNum}`;
    const { price, gift } = doc.settings.quantities.awards[quantityProperty]

    const confirmation = await Confirmation("Dar premio", [
        `Esto serán **${Currency}${price.toLocaleString("es-CO")}**.`,
        `El autor del mensaje recibirá **${Currency}${gift.toLocaleString("es-CO")}**.`,
        `Tienes ${user.parseCurrency(CustomEmojis)}.`,
        `Se enviará un mensaje a ${hall}.`
    ], interaction)
    if (!confirmation) return;

    if (!user.canBuy(price)) return new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "Dar Award",
            error: "No tienes suficiente dinero",
            money: user.economy.global.currency
        }
    }).send();

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
    hallEmbed.defFooter({ text: `Mensaje por ${message.author.tag}・Premio de Tier ${tierNum} por ${interaction.user === message.author ? `ellos mismos, ${interaction.user.tag}` : interaction.user.tag}`, icon: message.author.displayAvatarURL({ dynamic: true }) });

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
        interaction.followUp({
            ephemeral: true, embeds: [new ErrorEmbed(interaction, {
                type: "execError",
                data: {
                    guide: "No pude enviar el mensaje al canal, avísale a los Administradores. El autor del mensaje sí se recibió el premio."
                }
            })]
        })
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