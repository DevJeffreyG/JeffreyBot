const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Discord = require("discord.js");

const prettyms = require("pretty-ms");

const { Initialize, TutorialEmbed, LimitedTime } = require("../../resources/functions.js");

const commandInfo = {
    name: "mute",
    info: "Para mutear a algún usuario",
    params: [
        {
            name: "miembro", type: "NotSelfMember", optional: false
        },
        {
            name: "tiempo", display: "tiempo: 1d, 5h, 10m, etc", type: "Time", optional: true
        }
    ],
    userlevel: "STAFF",
    category: "MODERATION"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const member = response.find(x => x.param === "miembro").data;
        const tiempo = response.find(x => x.param === "tiempo").data || null;

        // Comando
        const muteRole = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "544691532104728597") : guild.roles.cache.find(x => x.id === Config.muteRole);
        const channel = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "483108734604804107") : guild.channels.cache.find(x => x.id === Config.logChannel);
        
        let mEmbed = new Discord.MessageEmbed()
        .setAuthor(`${tiempo ? "Temp Mute" : "Mute"}`, author.displayAvatarURL())
        .setDescription(`**—** Usuario muteado: ${member}
**—** Tiempo de mute: ${tiempo ? prettyms(tiempo, {secondsDecimalDigits: 0 }) : "Permanente"}
**—** Muteado por: ${author}`)
        .setColor(Colores.rojo);

        if(!tiempo){ // Para siempre
            await member.roles.add(muteRole)
        } else { // Temp mute
            // llamar la funcion
            await LimitedTime(guild, muteRole.id, member, tiempo);
        }

        message.react("✅");
        channel.send({embeds: [mEmbed]});
    }
}