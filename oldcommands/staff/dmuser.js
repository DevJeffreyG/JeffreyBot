const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "dmuser",
    aliases: ["dm"],
    info: "Envías un mensaje directo a un usuario. Puedes usar **{yo}** para poner TU nombre en el mensaje. Puedes usar **{user}** para poner el nombre del usuario al que se le envía el MD",
    params: [
        {
            name: "member", display: "miembro", type: "Member", optional: false
        },
        {
            name: "mensaje", type: "JoinString", optional: false
        }
    ],
    userlevel: "STAFF",
    category: "STAFF"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando
        let mdMember = response.find(x => x.param === "member").data;
        
        if(mdMember.user.bot) return message.reply("No puedo enviar un MD a un bot.");
        if(!args[1]) return message.channel.send({embeds: [embed]}).then(a => a.delete(ms('30s')));
        
          let str = response.find(x => x.param === "mensaje").data;
          let yoStr = str.replace(new RegExp('{yo}', "g"), `**${author.tag}**`);
          let finalStr = yoStr.replace(new RegExp('{user}', "g"), `**${mdMember.user.tag}**`);
      
          let finalEmbed = new Discord.MessageEmbed()
          .setAuthor(`Hola:`, "https://i.pinimg.com/originals/85/7f/d7/857fd79dfd7bd025e4cbb2169cd46e03.png")
          .setDescription(`${finalStr}`)
          .setFooter("Este es un mensaje directamente del staff del servidor.")
          .setColor(Colores.verde);
      
          mdMember.send({embeds: [finalEmbed]})
          .then(a => message.react("✅"))
          .catch(e => {
            return message.reply(`Usuario con los MDs desactivados.`);
          })
    }
}