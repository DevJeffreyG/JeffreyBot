const { Command, Categories, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources/");

const command = new Command({
    name: "ping",
    desc: "Revisa la latencia del bot con los servers de Discord",
    category: Categories.General
});
command.execute = async (interaction, models, params, client) => {
    let start = Date.now();
    interaction.reply(`${client.Emojis.Loading} Pong!`).then(() => {
        let diff = (Date.now() - start);
        let API = (client.ws.ping).toFixed(2)

        let embed = new Embed()
        .defAuthor({text: `🔔 Pong!`, title: true})
        .defField("📶 Ping", `${diff}ms`)
        .defField("💻 API", `${API}ms`)
        
        switch(true){
          case diff >= 180:
            embed.setColor(Colores.rojooscuro)
            break;
            
          case diff >= 120: 
            embed.setColor(Colores.rojo)
            break;
            
          default:
            embed.setColor(Colores.verde)
        }
        
        interaction.editReply({content: null, embeds: [embed]});
    });
}

module.exports = command;