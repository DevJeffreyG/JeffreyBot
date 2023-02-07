const { ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageContextMenuCommandInteraction, Client, hyperlink } = require("discord.js");
const { Colores } = require("../../src/resources");
const { ContextMenu, Categories, Embed, Confirmation } = require("../../src/utils");

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
    const { Guilds, Users } = models;

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

    const component = await msg.awaitMessageComponent({ filter, time: ms("1m") }).catch(err => console.log(err));
    component.deferUpdate();

    const doc = await Guilds.getOrCreate(interaction.guild.id);
    const user = await Users.getOrCreate({ user_id: interaction.user.id, guild_id: interaction.guild.id });
    const message_user = await Users.getOrCreate({ user_id: message.author.id, guild_id: interaction.guild.id });

    const hall = await interaction.guild.channels.fetch(doc.getChannel("general.halloffame"))

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

    const hallEmbed = new Embed();
    const star = hyperlink("★", message.url);
    var content = message.content;

    // Tiene attachments
    if (message.attachments.size !== 0) {
        const firstAttachment = message.attachments.first();
        content = `${message.content} ${hyperlink("archivo", firstAttachment.url)}`;

        hallEmbed.setImage(firstAttachment.url);
    } else
    // El mensaje tiene embeds
    if (message.embeds.length != 0) { 
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
    }

    hallEmbed.defAuthor({ text: message.author.tag, icon: message.author.displayAvatarURL() });
    hallEmbed.defDesc(`${star} ${content}`);
    hallEmbed.defColor(message.member.displayHexColor);
    hallEmbed.defFooter({text: `▸ Premio de Tier ${tierNum} por ${interaction.user === message.author ? `ellos mismos, ${interaction.user.tag}` : interaction.user.tag}`, timestamp: true});

    // Pagar
    user.economy.global.currency -= price;
    message_user.addCurrency(gift);

    await user.save();

    // Enviar mensaje
    hall.send({embeds: [hallEmbed]});

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