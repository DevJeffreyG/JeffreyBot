const { Command, Categories, Confirmation, ErrorEmbed, Embed, Sleep } = require("../../src/utils")
const { Config, Colores } = require("../../src/resources");

const command = new Command({
    name: "pay",
    desc: "Le das de tus Jeffros a otro usuario",
    category: Categories.Economy
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario al que le vas a dar Jeffros",
    req: true
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de Jeffros que vas a dar",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ephemeral: true});
    const { Users } = models
    const { usuario, cantidad } = params;
    const { Emojis } = client;

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
        `¿Deseas pagarle **${Emojis.Jeffros}${quantity.toLocaleString('es-CO')}** a ${member}?`,
        `Tienes **${Emojis.Jeffros}${author_user.economy.global.jeffros.toLocaleString('es-CO')}**.`,
        `${member} tiene **${Emojis.Jeffros}${user.economy.global.jeffros.toLocaleString('es-CO')}**.`,
        `Se mencionará al destinatario.`,
        `Esto no se puede deshacer, a menos que te los den devuelta.`
    ];

    let confirmation = await Confirmation("Pagar Jeffros", toConfirm, interaction);

    if(!confirmation) return;

    let notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "pay jeffros",
            error: "No tienes suficientes Jeffros",
            money: author_user.economy.global.jeffros
        }
    })

    if(author_user && author_user.economy.global.jeffros < quantity) return notEnough.send();

    if(author.id === member.id){
        let msg = await interaction.fetchReply();
        await Sleep(2000)
        
        let e = new Embed(msg.embeds[0])
        .defAuthor({text: "Oye esto no está bien", icon: Config.loadingGif})

        await interaction.editReply({embeds: [e]})

        await Sleep(2000)
        e.defAuthor({text: "Por favor, aléjate", icon: Config.errorPng})
        .defColor(Colores.rojo)
        .defDesc("...")
        return interaction.editReply({embeds: [e]});
    } else

    author_user.economy.global.jeffros -= quantity;
    await user.addJeffros(quantity);

    await author_user.save();

    const messenger = `**${author}**`;
    const pay = `**${Emojis.Jeffros}${quantity.toLocaleString('es-CO')}**`;
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

    return interaction.followUp({content: `**${author.tag}** ➡️ **${member}**.`, embeds: [doneEmbed], allowedMentions: { parse: ["users"]}});
}

module.exports = command;