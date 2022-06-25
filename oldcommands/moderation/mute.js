const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { HumanMs } = require("../../src/utils/");

const { Initialize, TutorialEmbed, LimitedTime } = require("../../src/utils/");
const { Users } = require("mongoose").models;

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
**—** Tiempo de mute: ${tiempo ? new HumanMs(tiempo).human : "Permanente"}
**—** Muteado por: ${author}`)
        .setColor(Colores.rojo);

        if(!tiempo){ // Para siempre
            await member.roles.add(muteRole)
        } else { // Temp mute
            // llamar la funcion
            let user = await Users.findOne({
                user_id: member.id,
                guild_id: guild.id
            });

            await LimitedTime(guild, muteRole.id, member, user, tiempo);
        }

        message.react("✅");
        channel.send({embeds: [mEmbed]});
    }
}