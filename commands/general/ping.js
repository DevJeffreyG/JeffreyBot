const Discord = require("discord.js")
const { Command, Embed } = require("../../src/utils")

const command = new Command({
    name: "ping",
    desc: "Revisa la latencia del bot con los servers de discord",
    category: "GENERAL"
});
command.execute = async (interaction, client) => {
    let start = Date.now();
    interaction.reply("Pong!").then(() => {
        let diff = (Date.now() - start);
        let API = (client.ws.ping).toFixed(2)

        let embed = new Embed()
        .defAuthor({text: `🔔 Pong!`, title: true})
        .defField("📶 Ping", `${diff}ms`)
        .defField("💻 API", `${API}ms`)
        
        switch(true){
          case diff >= 180:
            embed.setColor("#ff2f2f")
            break;
            
          case diff >= 120: 
            embed.setColor("#ffa12f")
            break;
            
          default:
            embed.setColor("#2fff3d")
        }
        
        interaction.editReply({content: null, embeds: [embed]});
    });
}

module.exports = command;