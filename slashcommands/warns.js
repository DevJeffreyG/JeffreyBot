const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const reglas = require("./../resources/reglas.json");

const Warn = require("../modelos/warn.js");
const SoftWarn = require("../modelos/softwarn.js");
const softwarn = require('../modelos/softwarn.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warns')
		.setDescription('Revisa tus warns, o si tienes permisos, los de algún usuario')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription("El usuario a revisar de warns")),
	async execute(interaction, client) {
        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const author = guild.members.cache.find(x => x.id === interaction.user.id);

        // codigo
        let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

        if(client.user.id === Config.testingJBID){
            staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
        }

        const isStaff = author.roles.cache.find(x => x.id === staffRole.id) ? true : false;
        // crear boton de eliminar mensaje
        const row = new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setCustomId("delmsg")
                    .setLabel("Eliminar mensaje")
                    .setStyle("DANGER")
            )
    
        const member = interaction.options.getUser("usuario") && isStaff ? guild.members.cache.find(x => x.id === interaction.options.getUser("usuario").id) : author;

        let error = new Discord.MessageEmbed()
        .setColor(Colores.rojo)
        .setAuthor(`| ${member.user.tag}`, member.user.displayAvatarURL())
        .setDescription(`Este usuario no tiene warns de ningún tipo.`);
        
        Warn.findOne({
            userID: member.id
        }, (err, warns) => {
            if(err) throw err;

            SoftWarn.findOne({
                userID: member.id
            }, async (err2, soft) => {
                if(err2) throw err;

                if((!soft || soft.warns.length === 0) && (!warns || warns.warns === 0)){
                    return interaction.reply({embeds: [error], ephemeral: true})
                }

                let w = !warns ? 0 : warns.warns;
                let n = !soft ? 0 : soft.warns.length;

                let badguy = new Discord.MessageEmbed()
                .setAuthor(`| ${member.user.tag}'s warns`, member.user.displayAvatarURL())
                .setDescription(`**Número de warns ** ❛ \`${w}\` ❜
**Número de Softwarns —** ❛ \`${n}\` ❜`)
                .setColor(Colores.verde);
                    
                if (n != 0){
                    let reglasArray = Object.values(reglas);
                    for (let i = 0; i < n; i++){

                        let regla = soft.warns[i].rule;

                        switch (regla){ // algunas reglas cambiaron de nombre D:
                            case "Problemas personales":
                            case "No Contenido NSFW / Comportamiento respetuoso":
                                regla = "Ambiente sano"
                                break;
                            
                            case "Cadenas de mensajes en el chat":
                                regla = "Sentido común"
                                break;
                        }

                        let index = reglasArray.indexOf(regla) + 1;
                            badguy.addField(`${i+1} — ${regla} : Regla N°${index}`, `**— Nota: ${soft.warns[i].note}**`)
                    }
                }

                if(isStaff){
                    interaction.reply({embeds: [badguy], ephemeral: false, components: [row]});
                    const reply = await interaction.fetchReply()

                    const f = i => i.customId === 'delmsg' && i.user.id === author.id;

                    const collector = interaction.channel.createMessageComponentCollector({ filter: f, time: 15000, max: 1 });

                    collector.on('collect', async i => {
                        await i.deferUpdate();
                        await i.deleteReply();
                    });

                    collector.on("end", async i => {
                        await reply.edit({ components: []})
                    })
                } else {
                    return interaction.reply({embeds: [badguy], ephemeral: true});
                }
            })
            
        })
	},
};