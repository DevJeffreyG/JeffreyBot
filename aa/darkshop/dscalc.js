const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, DarkShopWork, ValidateDarkShop } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");
const DarkShop = require("../../modelos/DarkShop.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "dscalc",
    aliases: ["calc", "calculator", "darkcalc", "dcalc"],
    info: "Determina automáticamente cuantos Jeffros tienes actualmente",
    params: [
        {
            name: "darkjeffros", type: "NaturalNumber", optional: true
        }
    ],
    userlevel: "USER",
    category: "DARKSHOP"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const user = await User.findOne({user_id: author.id, guild_id: guild.id}) ?? await new User({user_id: author.id, guild_id: guild.id}).save();
        const toCalc = response.find(x => x.param === "darkjeffros").data || (user.economy.dark.darkjeffros ?? 0);

        const dark = await DarkShop.findOne({guild_id: guild.id}) ?? await DarkShopWork(client, guild.id);

        // en caso de que no sea nivel 5 o superior
        let validation = await ValidateDarkShop(user, author);
        if(!validation[0]) return message.channel.send({embeds: [validation[1]]});

        // Comando
        const stonks = dark.inflation.old <= dark.inflation.value ? "📈" : "📉";
        
        let stonksEmbed = new Discord.MessageEmbed()
        .setAuthor(`Cálculo`, Config.darkLogoPng)
        .setDescription(`${stonks} **— ${dark.inflation.value}%**.
**— ${Emojis.Dark}${toCalc.toLocaleString('es-CO')} = ${Emojis.Jeffros}${Math.floor(toCalc*200*dark.inflation.value).toLocaleString('es-CO')}**.`)
        .setColor(Colores.negro);

        message.channel.send({embeds: [stonksEmbed]});

    }
}