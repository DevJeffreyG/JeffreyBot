const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const moment = require("moment");

const { Initialize, TutorialEmbed, Confirmation, importImage, FindNewId } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");
const GlobalData = require("../../modelos/globalData.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "sencuesta",
    aliases: ["spoll"],
    info: "Encuesta que se pone fuera de las encuestas hechas por la comunidad en el canal de anuncios",
    params: [
        {
            name: "duracion", type: "Time", optional: false
        },
        {
            name: "anuncio", type: "JoinString", optional: false
        }
    ],
    userlevel: "ADMIN",
    category: "STAFF"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const duration = response.find(x => x.param === "duracion").data;
        const anuncio = response.find(x => x.param === "anuncio").data;

        // Comando

        const channel = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "483007967239602196") : guild.channels.cache.find(x => x.id === Config.announceChannel);
        const timestamp = duration != Infinity ? moment().add(duration, "ms").toDate() : null;

        let imgEmbed = new Discord.MessageEmbed()
        .setImage(Config.votePollImage)
        .setColor(Colores.verdejeffrey)

        let embed = new Discord.MessageEmbed()
        .setTitle(`¡Nueva encuesta del STAFF!`)
        .setDescription(anuncio)
        .setColor(Colores.verdeclaro)
        .setFooter(`PUEDES VOTAR HASTA`)

        if(timestamp) embed.setTimestamp(timestamp);
        else embed.setFooter(`Vota aquí abajo ⬇️`)

        let msg = await channel.send({embeds: [imgEmbed, embed]});
        //let msg = await channel.send({embeds: [embed]});
        let pollId = await FindNewId(await GlobalData.find({"info.type": "temporalPoll", "info.guild_id": guild.id}), "info", "id");

        await new GlobalData({
            info: {
                type: "temporalPoll",
                guild_id: guild.id,
                channel_id: channel.id,
                message_id: msg.id,
                until: timestamp,
                id: pollId
            }
        }).save();

        await message.react("✅")

        await msg.react("✅");
        await msg.react("❌");
    }
}