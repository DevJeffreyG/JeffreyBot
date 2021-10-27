const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");

const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");

const Jeffros = require("../modelos/jeffros.js");
const Exp = require("../modelos/exp.js");
const GlobalData = require("../modelos/globalData.js");

const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('¡Revisa tu EXP, nivel y Jeffros actuales!')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription("El usuario a revisar sus estadísticas")),
	async execute(interaction, client) {
        await interaction.deferReply();
        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const author = client.users.cache.find(x => x.id === interaction.user.id);

        // codigo
        // Variables
        let mainChannel = guild.channels.cache.find(x => x.id === Config.mainChannel);

        if(client.user.id === Config.testingJBID){
            mainChannel = guild.channels.cache.find(x => x.id === "535500338015502357");
        }
        
        let user = interaction.options.getUser("usuario") ?? author;
        
        Exp.findOne({
            serverID: guild.id,
            userID: user.id
        }, (err, exp) => {
            if(err) throw err;
            
            Jeffros.findOne({
                serverID: guild.id,
                userID: user.id
            }, async (err2, jeffros) => {
                if(err2) throw err2;
                
                let actualJeffros = jeffros ? jeffros.jeffros : 0;
                let curExp = exp ? exp.exp : 0;
                let curLvl = exp ? exp.level : 0;
                let rep = exp ? exp.reputacion : 0;
                    
                let nxtLvlExp = 10 * (curLvl ** 2) + 50 * curLvl + 100; // fórmula de MEE6. 5 * (level ^ 2) + 50 * level + 100
                    
                let bdData = await GlobalData.findOne({
                    "info.type": "birthdayData",
                    "info.userID": author.id
                });

                let dataExists = bdData ? true : false;
                let bdString = "";

                if(dataExists && bdData.info.isLocked === true){
                day = bdData.info.birthd;
                month = bdData.info.birthm;

                switch(month){
                    case "1":
                    month = "Enero"
                    break;

                    case "2":
                    month = "Febrero"
                    break;

                    case "3":
                    month = "Marzo"
                    break;

                    case "4":
                    month = "Abril"
                    break;

                    case "5":
                    month = "Mayo"
                    break;

                    case "6":
                    month = "Junio"
                    break;

                    case "7":
                    month = "Julio"
                    break;

                    case "8":
                    month = "Agosto"
                    break;

                    case "9":
                    month = "Septiembre"
                    break;

                    case "10":
                    month = "Octubre"
                    break;

                    case "11":
                    month = "Noviembre"
                    break;

                    case "12":
                    month = "Diciembre"
                    break;

                    default:
                    month = null;
                    break;
                }

                bdString = day != null && month != null ? `**— Cumpleaños**: ${day} de ${month}.` : "";
                }

                let meEmbed = new Discord.MessageEmbed()
                .setAuthor(`| Estadísticas de ${user.tag}`, user.displayAvatarURL())
                .setDescription(`**— Nivel**: ${curLvl}
**— EXP**: ${curExp} / ${nxtLvlExp}.
**— Jeffros**: ${Emojis.Jeffros}${actualJeffros}.  
**— Reputación**: ${rep}.
${bdString}`)
                .setThumbnail(Config.jeffreyguildIcon)
                .setColor(Colores.verde);

                return interaction.editReply({embeds: [meEmbed]});
            })
        })
	},
};