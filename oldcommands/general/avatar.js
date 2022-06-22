const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "avatar",
    info: "Enviar la foto de un usuario, o la propia",
    params: [
        {
            name: "member", display: "miembro", type: "Member", optional: true
        }
    ],
    userlevel: "USER",
    category: "GENERAL"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando

        const member = response.find(x => x.param === "member").data || message.member;

        let embed = new Discord.MessageEmbed()
        .setAuthor(`${member.user.tag}`, `${member.user.displayAvatarURL()}`)
        .setImage(`${member.user.displayAvatarURL({format: 'png', dynamic: true, size: 1024 })}`)
        .setColor(Colores.verde);

        return message.channel.send({embeds: [embed]});

    }
}