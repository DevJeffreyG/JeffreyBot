const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed, Confirmation } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "pay",
    aliases: ["give", "pagar", "pago", "dar", "regalar"],
    info: "Le das de tus Jeffros a otro usuario",
    params: [
        {
            name: "miembro", type: "NotSelfMember", optional: false
        },
        {
            name: "cantidad", type: "NaturalNumber", optional: false
        }
    ],
    userlevel: "USER",
    category: "ECONOMY"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const member = response.find(x => x.param === "miembro").data;
        const quantity = response.find(x => x.param === "cantidad").data;

        // Comando
        let author_user = await User.findOne({
            user_id: author.id,
            guild_id: guild.id
        });

        const user = await User.findOne({
            user_id: member.id,
            guild_id: guild.id
        }) ?? await new User({
            user_id: member.id,
            guild_id: guild.id
        }).save();

        let toConfirm = [
            `¿Deseas pagarle **${Emojis.Jeffros}${quantity.toLocaleString('es-CO')}** a ${member}?`,
            `Tienes **${Emojis.Jeffros}${author_user.economy.global.jeffros.toLocaleString('es-CO') || 0}**.`,
            `${member} tiene **${Emojis.Jeffros}${user.economy.global.jeffros.toLocaleString('es-CO') || 0}**.`,
            `Esto no se puede deshacer, a menos que te los den devuelta.`
        ];

        let confirmation = await Confirmation("Pagar Jeffros", toConfirm, message);

        if(!confirmation) return;

        let notEnough = new Discord.MessageEmbed()
        .setAuthor(`Pagar Jeffros: Error`, Config.errorPng)
        .setDescription(`**—** ¡No tienes tantos Jeffros!
**—** Tienes: **${Emojis.Jeffros}${author_user.economy.global.jeffros.toLocaleString('es-CO') || 0}**.`)
        .setColor(Colores.rojo);

        if(author_user && author_user.economy.global.jeffros < quantity) return confirmation.edit({embeds: [notEnough]});
        author_user.economy.global.jeffros -= quantity;
        user.economy.global.jeffros += quantity;

        await author_user.save();
        await user.save();

        const messenger = `**${author}**`;
        const pay = `**${Emojis.Jeffros}${quantity.toLocaleString('es-CO')}**`;
        const reciever = `**${member}**`;

        let possibleDescriptions = [
            `${messenger} le pagó ${pay} a ${reciever}.`,
            `${reciever} recibió los ${pay} de ${messenger}.`,
            `${messenger} le dio ${pay} a ${reciever}.`,
            `${messenger} hizo una transacción de ${pay} para ${reciever}.`,
            `${reciever} depositó los ${pay} de ${messenger}.`,
            `${messenger} entregó ${pay} a ${reciever}.`
        ];

        let description = possibleDescriptions[Math.floor(Math.random() * possibleDescriptions.length)];

        let doneEmbed = new Discord.MessageEmbed()
        .setAuthor(`Hecho`, Config.bienPng)
        .setDescription(description)
        .setColor(Colores.verde);

        return confirmation.edit({content: `**${author.tag}** ➡️ **${member.user.tag}**.`, embeds: [doneEmbed]});

    }
}