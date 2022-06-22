const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
    name: "clear",
    aliases: ["cls", "del"],
    info: "Limipiar mensajes en el chat",
    params: [
        {
            name: "msgs", display: "n° de mensajes a eliminar", type: "Number", optional: false
        }
    ],
    userlevel: "ADMIN",
    category: "MODERATION"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        let delMgs = response.find(x => x.param === "msgs").data;

        // Comando
        if(delMgs > 100) delMgs = 100;

        await message.delete();
      
        message.channel.bulkDelete(delMgs).then(deleMsg => {
          message.channel.send(`Limpiados ${deleMsg.size} mensajes.`).then(msg => {
            setTimeout(() => {
              msg.delete();
            }, ms("7s"));
          });
        }).catch(err => {
          message.channel.send(`Sólo puedo eliminar mensajes que sean menores de 14 días.`).then(msg => {
            setTimeout(() => {
              msg.delete();
            }, ms("7s"));
          });
        });
    }
}