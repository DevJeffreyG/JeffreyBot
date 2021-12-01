const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");

const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");

const Package = require("./../package.json");
const changes = Config.changes;

const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const prefix = Config.prefix;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('changelog')
		.setDescription('Las últimas modificaciones hechas en la versión actual del bot.')
        .addBooleanOption(option =>
            option.setName('extended')
                .setDescription('Mostrar los detalles más extendidos? (Para usuarios de móvil)')),
	async execute(interaction, client) {
        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const member = guild.members.cache.find(x => x.id === interaction.user.id);

        const extended = interaction.options.getBoolean('extended');
        const fetch = await interaction.channel.messages.fetch({ limit: 25})
        const message = await fetch.first();
        // codigo

        let viewExtension = "ꜝ";

        let added = "<:Plus:792966881350123540>";
        let removed = "<:Minus:792966881530609736>";
        let updated = "<:Update:792966881690648576>";
        
        let addCounter = 0;
        let removeCounter = 0;
        let updateCounter = 0;

        let userIsOnMobible = member.presence && member.presence.clientStatus && member.presence.clientStatus.mobile === "online" && !member.presence.clientStatus.desktop ? true : false;

        if(extended || userIsOnMobible){
            let embed = new Discord.MessageEmbed()
            .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.\n(Versión EXTENDIDA)**\n`)
            .setColor(Colores.verde);
            for(let i = 0; i < changes.length; i++){
            let addToDesc;
            let hasExtended = true;

            // regex
            let str = changes[i].desc;
            let str2 = changes[i].extended ?? false;
            let extendedDetails;
            let desc = str.replace(
                new RegExp("{ PREFIX }", "g"),
                `${prefix}`
            );

            if(str2){
                extendedDetails = str2.replace(
                new RegExp("{ PREFIX }", "g"),
                `${prefix}`
                );
            } else {
                hasExtended = false;
            }

            switch(changes[i].type){
                case "added":
                if(addCounter == 0){
                    addToDesc = hasExtended ? `\n**• Agregado •**\n${added} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Agregado •**\n${added} ${desc}.\n`;
                } else {
                    addToDesc = hasExtended ? `${added} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `${added} ${desc}.\n`;
                }
                embed.setDescription(embed.description + addToDesc)
                addCounter++;
                break;

                case "updated":
                if(updateCounter == 0){
                    addToDesc = hasExtended ? `\n**• Actualizado •**\n${updated} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Actualizado •**\n${updated} ${desc}.\n`;
                } else {
                    addToDesc = hasExtended ? `${updated} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `${updated} ${desc}.\n`;
                }
                embed.setDescription(embed.description + addToDesc)
                updateCounter++;
                break;

                case "removed":
                if(removeCounter == 0){
                    addToDesc = hasExtended ? `\n**• Eliminado •**\n${removed} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Eliminado •**\n${removed} ${desc}.\n`;
                } else {
                    addToDesc = hasExtended ? `${removed} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n`: `${removed} ${desc}.\n`;
                }
                embed.setDescription(embed.description + addToDesc)
                removeCounter++;
                break;
            }
            }

            return interaction.reply({embeds: [embed], ephemeral: true});
        }

        let embed = new Discord.MessageEmbed()
        .setDescription(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.**\n`)
        .setFooter(`* Si estás en PC, poniendo el mouse sobre '!', podrás ver detalles extendidos de los cambios, el link no lleva a nada importante.\n— En móvil usa '${prefix}changelog extended: True'.`)
        .setColor(Colores.verde);

        for(let i = 0; i < changes.length; i++){
            let addToDesc;
            let hasExtended = true;

            // regex
            let str = changes[i].desc;
            let str2 = changes[i].extended ?? false;
            let extendedDetails;
            let desc = str.replace(
            new RegExp("{ PREFIX }", "g"),
            `${prefix}`
            );

            if(str2){
            extendedDetails = str2.replace(
                new RegExp("{ PREFIX }", "g"),
                `${prefix}`
            );
            } else {
            hasExtended = false;
            }

            switch(changes[i].type){
            case "added":
                if(addCounter == 0){
                addToDesc = hasExtended ? `\n**• Agregado •**\n${added} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Agregado •**\n${added} ${desc}.\n`;
                } else {
                addToDesc = hasExtended ? `${added} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `${added} ${desc}.\n`;
                }
                embed.setDescription(embed.description + addToDesc)
                addCounter++;
                break;

            case "updated":
                if(updateCounter == 0){
                addToDesc = hasExtended ? `\n**• Actualizado •**\n${updated} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Actualizado •**\n${updated} ${desc}.\n`;
                } else {
                addToDesc = hasExtended ? `${updated} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `${updated} ${desc}.\n`;
                }
                embed.setDescription(embed.description + addToDesc)
                updateCounter++;
                break;

            case "removed":
                if(removeCounter == 0){
                addToDesc = hasExtended ? `\n**• Eliminado •**\n${removed} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Eliminado •**\n${removed} ${desc}.\n`;
                } else {
                addToDesc = hasExtended ? `${removed} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n`: `${removed} ${desc}.\n`;
                }
                embed.setDescription(embed.description + addToDesc)
                removeCounter++;
                break;
            }
        }
  
    return interaction.reply({embeds: [embed]});

	},
};