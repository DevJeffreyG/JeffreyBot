const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "jbnews",
    aliases: ["news"],
    info: "Se crea un anuncio mencionando a el rol de JB News con un embed con la noticia",
    params: [
        {
            name: "anuncio", type: "JoinString", optional: true
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
        let anuncio = response.find(x => x.param === "anuncio").data ||  "";
        let jbNRole = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === '790393911519870986') : guild.roles.cache.find(x => x.id === Config.jbnews);

        let ch = client.user.id === Config.testingJBID ? message.guild.channels.cache.find(x => x.id === "483007967239602196") : message.guild.channels.cache.find(x => x.id === Config.announceChannel);
        // Comando
        if(!anuncio && message.attachments.size === 0) return message.reply("Si no hay anuncio, adjunta una imagen.");
      
        let nEmbed = new Discord.EmbedBuilder()
        .setColor(Colores.verde)
        .setDescription(anuncio)
        .setFooter(`Noticia por ${author.tag}`, client.user.displayAvatarURL())
        .setTimestamp();
    
        if(message.attachments.size != 0) { // si hay attachements, agregarlos al embed.
            let firstAttachment = message.attachments.first();
            nEmbed.setImage(firstAttachment.url);
        }
    
        if(!args[0] && message.attachments.size != 0) {
            nEmbed.setAuthor(`¡Novedades de Jeffrey Bot!`, guild.iconURL())
        } else if(args[0] && message.attachments.size != 0) {
            nEmbed.setTitle(`¡Novedades de Jeffrey Bot!`);
            nEmbed.setThumbnail(client.user.displayAvatarURL());
        } else {
            nEmbed.setTitle(`¡Novedades de Jeffrey Bot!`);
            nEmbed.setThumbnail(client.user.displayAvatarURL());
        }
          
        ch.send({content: `${jbNRole}`, embeds: [nEmbed]});
    }
}