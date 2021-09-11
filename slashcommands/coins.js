const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require("discord.js");
const ms = require("ms");
const prettyms = require("pretty-ms");

const Emojis = require("../resources/emojis.json");
const Responses = require("../resources/coinsresponses.json");
const Colores = require("../resources/colores.json");
const Cumplidos = require("../resources/cumplidos.json");
let { multiplier } = require("../base.json");

const GlobalData = require("../modelos/globalData.js");
const Jeffros = require("../modelos/jeffros.js");

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
        let tmoney = `**${Emojis.Jeffros}${money}**`;
        let randommember = guild.members.cache.random();

        while (randommember.user.id === author.id) { // el randommember NO puede ser el mismo usuario
            console.log("'/coins', Es el mismo usuario, buscar otro random")
            randommember = guild.members.cache.random()
        }

        randommember = `**${randommember.user.tag}**`;

        let fakemoney = `${Math.ceil(Math.random() * 1000) + 999} Jeffros`;

        if (multiplier != 1) {
            money = money * multiplier;
            tmoney = `**${Emojis.Jeffros}${money}**`;
        }

        // buscar la globaldata
        let query = await GlobalData.find({
            "info.type": "roleDuration",
            "info.userID": author.id,
            "info.special.type": "boostMultiplier"
        }, (err, boosts) => {
            if(err) throw err;
        });

        for (let i = 0; i < query.length; i++) {
            const q = query[i];
            
            let specialData = q.info.special;

            if(specialData.specialObjective === "jeffros" || specialData.specialObjective === "all"){ // si el boost de de jeffros
            money = money * Number(specialData.specialValue);
            tmoney = `**${Emojis.Jeffros}${money}📈**`;

            console.log(author.tag, tmoney);
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

        Jeffros.findOne(
        {
            serverID: guild.id,
            userID: author.id
        }, (err, jeffros) => {
            if (err) throw err;

            if (workCooldown.has(author.id)){
                let timer = coolded.get(author.id)
                let left = prettyms((ms("10m")) - (new Date().getTime() - timer), {secondsDecimalDigits: 0 });
                return interaction.editReply(
                `Usa este comando en ${left}, ${randomCumplidos}`
                );
            } else {
                workCooldown.add(author.id);
                let timeMS = new Date().getTime();
                coolded.set(author.id, timeMS);

                setTimeout(() => {
                coolded.delete(author.id)
                workCooldown.delete(author.id);
                }, ms("10m"));
            }

            if (!jeffros) {
                const newJeffros = new Jeffros({
                userID: author.id,
                serverID: guild.id,
                jeffros: money
                });

                newJeffros.save();
            } else {
                jeffros.jeffros += money;
                jeffros.save();
            }


            interaction.editReply({embeds: [embed]});
            }
        );


	},
};