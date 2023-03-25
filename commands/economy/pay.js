const { Command, Categories, Confirmation, ErrorEmbed, Embed, Sleep } = require("../../src/utils")
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "pay",
    desc: "Le das de tu dinero a otro usuario",
    category: Categories.Economy
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario al que le vas a dar dinero",
    req: true
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de dinero que vas a dar",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });
    const { Users } = models
    const { usuario, cantidad } = params;
    const { Emojis, EmojisObject } = client;
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const author = interaction.user;
    const member = usuario.member;
    const quantity = cantidad.value;

    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);

    // codigo
    let author_user = await Users.getOrCreate({
        user_id: author.id,
        guild_id: guild.id
    });

    const user = await Users.getOrCreate({
        user_id: member.id,
        guild_id: guild.id
    });

    let toConfirm = [
        `¿Deseas pagarle **${Currency}${quantity.toLocaleString('es-CO')}** a ${member}?`,
        `Tienes **${Currency}${author_user.economy.global.currency.toLocaleString('es-CO')}**.`,
        `${member} tiene **${Currency}${user.economy.global.currency.toLocaleString('es-CO')}**.`,
        `Se mencionará al destinatario.`,
        `Esto no se puede deshacer, a menos que te los den devuelta.`
    ];

    let confirmation = await Confirmation("Pagar dinero", toConfirm, interaction);
    if (!confirmation) return;

    let notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "pay",
            error: "No tienes suficiente dinero",
            money: author_user.economy.global.currency
        }
    })

    if (!author_user.canBuy(quantity)) return notEnough.send();

    if (author.id === member.id) {
        let msg = await interaction.fetchReply();
        await Sleep(2000)

        let e = new Embed(msg.embeds[0])
            .defAuthor({ text: "Oye esto no está bien", icon: EmojisObject.Loading.url })

        await interaction.editReply({ embeds: [e] })

        await Sleep(2000)
        e.defAuthor({ text: "Por favor, aléjate", icon: EmojisObject.Error.url })
            .defColor(Colores.rojo)
            .defDesc("...")
        return interaction.editReply({ embeds: [e] });
    } else

        author_user.economy.global.currency -= quantity;
    await user.addCurrency(quantity);

    await author_user.save();

    const messenger = `**${author}**`;
    const pay = `**${Currency}${quantity.toLocaleString('es-CO')}**`;
    const reciever = `**${member}**`;

    let possibleDescriptions = [
        `${messenger} le pagó ${pay} a ${reciever}`,
        `${reciever} recibió los ${pay} de ${messenger}`,
        `${messenger} le dio ${pay} a ${reciever}`,
        `${messenger} hizo una transacción de ${pay} para ${reciever}`,
        `${reciever} depositó los ${pay} de ${messenger}`,
        `${messenger} entregó ${pay} a ${reciever}`
    ];

    let description = possibleDescriptions[Math.floor(Math.random() * possibleDescriptions.length)];

    let doneEmbed = new Embed({
        type: "success",
        data: {
            desc: description
        }
    })
    interaction.editReply({ embeds: [new Embed({ type: "success" })] });
    return interaction.followUp({ content: `**${author.tag}** ➡️ **${member}**.`, embeds: [doneEmbed], allowedMentions: { parse: ["users"] } });
}

module.exports = command;