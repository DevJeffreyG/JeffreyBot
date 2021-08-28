const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Revisa la latencia del bot con los servers de discord'),
	async execute(interaction, client) {
		let start = Date.now();
		interaction.reply('Pong! ').then(() => {
			let diff = (Date.now() - start);
			let API = (client.ws.ping).toFixed(2)
				let embed = new Discord.MessageEmbed()
				.setTitle(`🔔 Pong!`)
				.addField("📶 Ping", `${diff}ms`)
				.addField("💻 API", `${API}ms`)
				
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
	},
};