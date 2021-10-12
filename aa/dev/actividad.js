const Discord = require("discord.js");
const Config = require("../.././base.json");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

const commandInfo = {
  name: "activity",
  aliases: ["actividad"],
  info: "Cambiar la actividad del cliente",
  params: [
      {
          name: "nueva actividad", type: "JoinString", optional: false
      }
  ],
  userlevel: "DEVELOPER",
  category: "DEVELOPER"
}

module.exports = {
  data: commandInfo,
  async execute(client, message, args){
    const { guild, author, prefix, executionInfo } = await Initialize(client, message);

    let response = await TutorialEmbed(commandInfo, executionInfo, args);

    if(response[0] === "ERROR") return console.log(response); // si hay algún error

    // Comando
    const argcustom = await response.find(x => x.param === "nueva actividad").data;
    
    if(argcustom == "default") {
      // para cada guild fetchear(?
      let guilds = await client.guilds.fetch();
      //console.log(guilds);

      let totalMembers = 0;
      for(const key of guilds.keys()){
        let actualGuild = client.guilds.cache.find(x => x.id === key);
        actualGuild.members.fetch();

        totalMembers += actualGuild.memberCount;
      }

      let setgamembed2 = new Discord.MessageEmbed()
      .setColor(0x07DE47)
      .setAuthor(`| Actividad seleccionada sin problemas.`, Config.bienPng)
      .setDescription(`${client.user.username} tiene el juego por DEFAULT.`)
      .setFooter(`Puesto por ${author.username}.`, author.avatarURL);
      client.user.setActivity(`${prefix}ayuda - ${totalMembers} usuarios🔎`);
      
      return message.channel.send({embeds: [setgamembed2]});
    }

    let setgamembed = new Discord.MessageEmbed()
      .setColor(0x07DE47)
      .setAuthor(`| Actividad seleccionada sin problemas.`, Config.bienPng)
      .setDescription(`${client.user.username} ahora juega \`${argcustom}\`.`)
      .setFooter(`Puesto por ${author.username}.`, author.avatarURL);


    client.user.setActivity(argcustom);
    console.log(`${client.user.username} Ahora juega ${argcustom}.`);
    message.channel.send({embeds: [setgamembed]});
  }
}