const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const reglas = require("./../resources/reglas.json");

const User = require("../modelos/User.model.js");

const Warn = require("../modelos/warn.js");
const SoftWarn = require("../modelos/softwarn.js");

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

        if(!member) return interaction.reply({content: "No pude encontrar a ese usuario", ephemeral: true});

        let error = new Discord.MessageEmbed()
        .setColor(Colores.rojo)
        .setAuthor(`${member.user.tag}`, member.user.displayAvatarURL())
        .setDescription(`Este usuario no tiene warns de ningún tipo.`);
        
        const user = await User.findOne({
            user_id: member.id,
            guild_id: guild.id
        });

        if(!user) return interaction.reply({embeds: [error], ephemeral: true});
        
        const warns = user.warns;
        const softwarns = user.softwarns;

        if((!softwarns || softwarns.length === 0) && (!warns || warns.length === 0)){
            return interaction.reply({embeds: [error], ephemeral: true})
        }

        let warnsE = new Discord.MessageEmbed()
        .setAuthor(`${member.user.tag}'s warns`, member.user.displayAvatarURL())
        .setDescription(`**Número de warns ** ❛ \`${warns.length}\` ❜`)
        .setColor(Colores.verde);

        let softwarnsE = new Discord.MessageEmbed()
        .setAuthor(`${member.user.tag}'s softwarns`, member.user.displayAvatarURL())
        .setDescription(`**Número de softwarns ** ❛ \`${softwarns.length}\` ❜`)
        .setColor(Colores.verde);

        // foreach
        warns.forEach(warn => {
            // sacar la regla
            let regla = reglas[warn.rule_id].regla;

            warnsE.addField(`— ${regla} : Regla N°${warn.rule_id}`, `**— [Pruebas](${warn.proof})\n— ID: ${warn.id}**`)
        });

        softwarns.forEach(softwarn => {
            // sacar la regla
            let regla = reglas[softwarn.rule_id].regla;

            softwarnsE.addField(`— ${regla} : Regla N°${softwarn.rule_id}`, `**— [Pruebas](${softwarn.proof})\n— ID: ${softwarn.id}**`)
        });

        if(isStaff){
            interaction.reply({embeds: [warnsE, softwarnsE], ephemeral: false, components: [row]});
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
            return interaction.reply({embeds: [warnsE, softwarnsE], ephemeral: true});
        }
	},
};