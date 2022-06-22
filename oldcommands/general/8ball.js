const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../src/utils/");

const commandInfo = {
  name: "8ball",
  aliases: ["bola8"],
  info: "La clásica 8ball",
  params: [
      {
          name: "pregunta", type: "JoinString", optional: false
      }
  ],
  userlevel: "USER",
  category: "GENERAL"
}

module.exports = {
  data: commandInfo,
  async execute(client, message, args){
    console.log(commandInfo)

    const { guild, author, prefix, staffRole, executionInfo } = await Initialize(client, message);

    let response = await TutorialEmbed(commandInfo, executionInfo, args);

    if(response[0] === "ERROR") return console.log(response); // si hay algún error

    // Comando
    let replies = ["Sí.", "No.", "No lo sé", "Te mentiría si no.", "¿Estamos tontos?", "Obvio.", "Bastante claro que no.", "La verdad es que no.", "La verdad, sí."];

    let answer = Math.floor(Math.random() * replies.length);
    let pregunta = await response.find(x => x.param === "pregunta").data;

    let pregEmbed = new Discord.MessageEmbed()
      .setColor(Colores.verde)
      .setAuthor(`${message.author.tag}`, author.displayAvatarURL())
      .addField("Pregunta", pregunta)
      .addField("Respuesta", replies[answer]);

    message.channel.send({embeds: [pregEmbed]});
  }
}