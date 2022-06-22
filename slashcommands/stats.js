const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");

const Config = require("./../src/resources/base.json");
const Colores = require("./../src/resources/colores.json");
const Emojis = require("./../src/resources/emojis.json");

const User = require("../modelos/User.model.js");

const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('¡Revisa tu EXP, nivel y Jeffros actuales, o de otro usuario!')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription("El usuario a revisar sus estadísticas")),
	async execute(interaction, client) {
        await interaction.deferReply();
        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const author = client.users.cache.find(x => x.id === interaction.user.id);

        // codigo
        const _user = interaction.options.getUser("usuario") ?? author;

        let user = await User.findOne({
            user_id: _user.id,
            guild_id: guild.id
        });

        let actualJeffros = user ? user.economy.global.jeffros.toLocaleString('es-CO') : 0;
        let curExp = user ? user.economy.global.exp.toLocaleString('es-CO') : 0;
        let curLvl = user ? user.economy.global.level.toLocaleString('es-CO') : 0;
        let rep = user ? user.economy.global.reputation.toLocaleString('es-CO') : 0;
            
        let nxtLvlExp = (10 * (curLvl ** 2) + 50 * curLvl + 100).toLocaleString('es-CO'); // fórmula de MEE6. 5 * (level ^ 2) + 50 * level + 100

        let bdData = user.data.birthday;

        let dataExists = bdData ? true : false;
        let bdString = "";

        if(dataExists && bdData.locked){
            day = bdData.day;
            month = bdData.month;

            switch(month){
                case 1:
                    month = "Enero"
                    break;

                case 2:
                    month = "Febrero"
                    break;

                case 3:
                    month = "Marzo"
                    break;

                case 4:
                    month = "Abril"
                    break;

                case 5:
                    month = "Mayo"
                    break;

                case 6:
                    month = "Junio"
                    break;

                case 7:
                    month = "Julio"
                    break;

                case 8:
                    month = "Agosto"
                    break;

                case 9:
                    month = "Septiembre"
                    break;

                case 10:
                    month = "Octubre"
                    break;

                case 11:
                    month = "Noviembre"
                    break;

                case 12:
                    month = "Diciembre"
                    break;

                default:
                    month = null;
                    break;
            }

            bdString = (day != null) && (month != null) ? `**— Cumpleaños**: ${day} de ${month}` : "";
        }

        let meEmbed = new Discord.MessageEmbed()
        .setAuthor(`Estadísticas de ${_user.tag}`, _user.displayAvatarURL())
        .setDescription(`**— Nivel**: ${curLvl}
**— EXP**: ${curExp} / ${nxtLvlExp}
**— Jeffros**: ${Emojis.Jeffros}${actualJeffros}
**— Puntos de reputación**: ${rep}
${bdString}`)
        .setThumbnail(Config.jeffreyguildIcon)
        .setColor(Colores.verde);

        return interaction.editReply({embeds: [meEmbed]});
	},
};