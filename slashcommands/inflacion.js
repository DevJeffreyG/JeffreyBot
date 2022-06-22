const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");

const Config = require("./../src/resources/base.json");
const Colores = require("./../src/resources/colores.json");
const Emojis = require("./../src/resources/emojis.json");

const DarkShop = require("../modelos/DarkShop.model.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inflacion')
		.setDescription('Te muestra la inflación actual de los DarkJeffros.'),
	async execute(interaction, client) {
        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const author = client.users.cache.find(x => x.id === interaction.user.id);

        // codigo
        const dark = await DarkShop.findOne({
            guild_id: guild.id
        });

        let stonks;
        if(dark.inflation.old <= dark.inflation.value){
            stonks = "📈";
        } else {
            stonks = "📉";
        }

        let stonksEmbed = new Discord.MessageEmbed()
        .setAuthor(`DarkShop: Inflación`, Config.darkLogoPng)
        .setDescription(`${stonks} **—** La inflación actual de los DarkJeffros es de un **${dark.inflation.value}%**.
**— ${Emojis.Dark}1 = ${Emojis.Jeffros}${Math.floor(200*dark.inflation.value).toLocaleString('es-CO')}**.
**—** Antes era de un \`${dark.inflation.old}%\`.`)
        .setColor(Colores.negro);

        interaction.reply({embeds: [stonksEmbed]});
	},
};