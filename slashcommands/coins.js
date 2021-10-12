const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const ms = require("ms");
const prettyms = require("pretty-ms");

const Emojis = require("../resources/emojis.json");
const Responses = require("../resources/coinsresponses.json");
const Colores = require("../resources/colores.json");
const Cumplidos = require("../resources/cumplidos.json");
let { multiplier } = require("../base.json");

const User = require("../modelos/User.model.js");

const workCooldown = new Set();
const coolded = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coins')
		.setDescription('Gana Jeffros extras en un intervalo de 10 minutos!'),
	async execute(interaction, client) {
        await interaction.deferReply();
        var randomCumplidos = Cumplidos.c[Math.floor(Math.random() * Cumplidos.c.length)];

        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const author = client.users.cache.find(x => x.id === interaction.user.id);
        const member = guild.members.cache.find(x => x.id === interaction.user.id);

        let money = Math.ceil(Math.random() * 20);
        let tmoney = `**${Emojis.Jeffros}${money.toLocaleString('es-CO')}**`;
        let randommember = guild.members.cache.random();

        while (randommember.user.id === author.id) { // el randommember NO puede ser el mismo usuario
            console.log("'/coins', Es el mismo usuario, buscar otro random")
            randommember = guild.members.cache.random()
        }

        randommember = `**${randommember.user.tag}**`;

        let fakemoney = `${Math.ceil(Math.random() * 1000) + 999} Jeffros`;

        if (multiplier != 1) {
            money = money * multiplier;
            tmoney = `**${Emojis.Jeffros}${money.toLocaleString('es-CO')}**`;
        }

        // buscar usuario
        let user = await User.findOne({
            user_id: author.id,
            guild_id: guild.id
        });

        if(!user){
            user = await new User({
            user_id: member.id,
            guild_id: guild.id
            }).save();
        }

        // buscar si tiene boost
        for (let i = 0; i < user.data.temp_roles.length; i++) {
            const temprole = user.data.temp_roles[i];
            const specialInfo = temprole.special;
            
            if(specialInfo.type === "boostMulitplier"){
                if(specialInfo.objetive === "jeffros" || specialInfo.objetive === "all"){
                    money = money * Number(specialData.specialValue);
                    tmoney = `**${Emojis.Jeffros}${money.toLocaleString('es-CO')}📈**`;
                    console.log(author.tag, "Boost de JEFFROS.")
                }
            }
        }

        let index = Responses.r[Math.floor(Math.random() * Responses.r.length)];
        let textString = index.text;
        let text = textString.replace(
            new RegExp("{ MONEY }", "g"),
            `${tmoney}`
        );

        text = text.replace(
            new RegExp("{ MEMBER }", "g"),
            `${randommember}`
        );

        text = text.replace(
            new RegExp("{ FAKE MONEY }", "g"),
            `${fakemoney}`
        );

        let memberColor = member.displayHexColor;

        let embed = new Discord.MessageEmbed()
            .setColor(memberColor)
            .setDescription(`${text}.`);

        if(index.author.toUpperCase() === "NONE"){
            
        } else {
            let rAuthor = guild.members.cache.find(x => x.id === index.author);
            let suggestor = rAuthor ? rAuthor.user.tag : "un usuario";
            let img = rAuthor ? rAuthor.user.displayAvatarURL() : guild.iconURL();
            embed.setFooter(`• Respuesta sugerida por ${suggestor}`, img)
        }

        if (workCooldown.has(author.id)){
            let timer = coolded.get(author.id)
            let left = prettyms((ms("10m")) - (new Date().getTime() - timer), {secondsDecimalDigits: 0 });
            return interaction.editReply(`Usa este comando en ${left}, ${randomCumplidos}`);
        } else {
            workCooldown.add(author.id);
            let timeMS = new Date().getTime();
            coolded.set(author.id, timeMS);

            setTimeout(() => {
                coolded.delete(author.id)
                workCooldown.delete(author.id);
            }, ms("10m"));
        }

        user.economy.global.jeffros += money;
        await user.save();

        interaction.editReply({embeds: [embed]});

	},
};