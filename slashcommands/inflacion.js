const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");

const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");

const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;

const GlobalData = require("../modelos/globalData.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inflacion')
		.setDescription('Te muestra la inflación actual de los DarkJeffros.'),
	async execute(interaction, client) {
        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const author = client.users.cache.find(x => x.id === interaction.user.id);

        // codigo
        const dark = await GlobalData.findOne({
            "info.type": "dsInflation"
        });

        let stonks;
        if(dark.info.oldinflation <= dark.info.inflation){
            stonks = "📈";
        } else {
            stonks = "📉";
        }

        let stonksEmbed = new Discord.MessageEmbed()
        .setAuthor(`| DarkShop: Inflación`, Config.darkLogoPng)
        .setDescription(`${stonks} **—** La inflación actual de los DarkJeffros es de un **${dark.info.inflation}%**.
**— ${Emojis.Dark}1 = ${Emojis.Jeffros}${Math.floor(200*dark.info.inflation).toLocaleString('es-CO')}**.
**—** Antes era de un \`${dark.info.oldinflation}%\`.`)
        .setColor(Colores.negro);

        interaction.reply({embeds: [stonksEmbed]});
	},
};