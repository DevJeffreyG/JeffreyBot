const { Command, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources/");
const { time } = require("discord.js");

const command = new Command({
  name: "ping",
  desc: "Revisa la latencia del bot con los servers de Discord"
});
command.execute = async (interaction, models, params, client) => {
  let start = Date.now();
  try {
    await interaction.reply(`${client.Emojis.Loading} Ping...`);

    let diff = (Date.now() - start);
    let API = (client.ws.ping).toFixed(2)

    let embed = new Embed()
      .defTitle(`🔔 Pong!`)
      .defDesc(`### ${client.Emojis.JeffreyBot} ${client.user.displayName} v${client.version} Online desde ${time(client.readyAt, "R")}`)
      .defField("📶 Ping", `${diff}ms`, true)
      .defField("💻 API", `${API}ms`, true)

    switch (true) {
      case diff >= 180:
        embed.setColor(Colores.rojooscuro)
        break;

      case diff >= 120:
        embed.setColor(Colores.rojo)
        break;

      default:
        embed.setColor(Colores.verde)
    }

    return await interaction.editReply({ content: null, embeds: [embed] });
  } catch (err) {
    console.error("🔴 %s", err);
  }
}

module.exports = command;