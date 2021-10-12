const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const fs = require("fs");
const ms = require("ms");

const Config = require("../base.json");
const Colores = require("../resources/colores.json");
const Emojis = require("../resources/emojis.json");
const prefix = Config.prefix;

const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ayuda')
		.setDescription('Todos los comandos disponibles en el bot!'),
	async execute(interaction, client) {
        await interaction.deferReply({ephemeral: true});
        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const member = guild.members.cache.find(x => x.id === interaction.user.id);
        const helpEmojiURL = "https://cdn.discordapp.com/emojis/494282181296914432.png";

        // get all commands
        const baseCommands = [];
        const baseCommandsFolder = fs.readdirSync("./aa").filter(file => !file.endsWith(".txt")); // quitar el layout LMAO

        for (const folder of baseCommandsFolder) {
            const baseCommandsFiles = fs.readdirSync(`./aa/${folder}`).filter(file => file.endsWith(".js"));

            for (const file of baseCommandsFiles) {
                const command = require(`../aa/${folder}/${file}`);
            
                // push name onto aliases
                const aliases = command.data.aliases || [];
                aliases.push(command.data.name);
                command.data.aliases = aliases;
                // set filename
                command.data.file = file;
                baseCommands.push(command.data);
            }
        }

        baseCommands.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)); // me lo robe y no entiendo como funciona :D

        // roles
        let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
        let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

        if(client.user.id === Config.testingJBID){
            jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
            staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
        }

        // codigo

        let general = new Discord.MessageEmbed()
        .setAuthor(`Comandos generales`, helpEmojiURL)
        .setColor(Colores.verde);

        let fun = new Discord.MessageEmbed()
        .setAuthor(`Comandos de diversión`, helpEmojiURL)
        .setColor(Colores.verde);

        let music = new Discord.MessageEmbed()
        .setAuthor(`Comandos de música ! MANTENIMIENTO !`, helpEmojiURL)
        .setColor(Colores.verde);

        let economy = new Discord.MessageEmbed()
        .setAuthor(`Comandos de economía`, helpEmojiURL)
        .setColor(Colores.verde);

        let moderation = new Discord.MessageEmbed()
        .setAuthor(`Comandos de moderación`, helpEmojiURL)
        .setColor(Colores.rojo);

        let staff = new Discord.MessageEmbed()
        .setAuthor(`Comandos de STAFF`, helpEmojiURL)
        .setColor(Colores.rojo);

        let dev = new Discord.MessageEmbed()
        .setAuthor(`Comandos de desarrollador`, helpEmojiURL)
        .setColor(Colores.nocolor);

        let [generalDescription, funDescription, musicDescription, economyDescription, moderationDescription, staffDescription, devDescription] = ["", "", "", "", "", "", ""];

        for (let i = 0; i < baseCommands.length; i++) {
            const command = baseCommands[i];

            const toAdd = `▸ \`${prefix}${command.name}\`: ${command.info}.\n`;

            switch(command.category){
                case "GENERAL":
                    generalDescription += toAdd;
                    break;
                
                case "FUN":
                    funDescription += toAdd;
                    break;

                case "MUSIC":
                    musicDescription += toAdd;
                    break;

                case "ECONOMY":
                    economyDescription += toAdd;
                    break;
                
                case "MODERATION":
                    moderationDescription += toAdd;
                    break;

                case "STAFF":
                    staffDescription += toAdd;
                    break;
                    
                case "DEVELOPER":
                    devDescription += toAdd;
                    break;

                default:
                    console.log("ERROR HOLA?!!?? XDXDXDDX", command);
            }

        }

        general.setDescription(generalDescription);
        fun.setDescription(funDescription);
        music.setDescription(musicDescription);
        economy.setDescription(economyDescription);
        moderation.setDescription(moderationDescription);
        staff.setDescription(staffDescription);
        dev.setDescription(devDescription);

        let isStaff = member.roles.cache.find(x => x.id === staffRole.id) ? true : false;
        let isJeffrey = member.roles.cache.find(x => x.id === jeffreyRole.id) ? true : false;
        
        let arrayEmbeds = [];

        if(general.description) arrayEmbeds.push(general);
        if(fun.description) arrayEmbeds.push(fun);
        if(music.description) arrayEmbeds.push(music);
        if(economy.description) arrayEmbeds.push(economy);

        if(isJeffrey){
            if(moderation.description) arrayEmbeds.push(moderation);
            if(staff.description) arrayEmbeds.push(staff);
            if(dev.description) arrayEmbeds.push(dev);
        } else if(isStaff){
            if(moderation.description) arrayEmbeds.push(moderation);
            if(staff.description) arrayEmbeds.push(staff);
        }

        interaction.editReply({embeds: arrayEmbeds, ephemeral: true});
    }
}