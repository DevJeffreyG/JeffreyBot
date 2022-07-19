const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, DarkShopWork, ValidateDarkShop } = require("../../src/utils/");
const { Users, DarkShops } = require("mongoose").models;

const commandInfo = {
    name: "dschange",
    aliases: ["change"],
    info: "Cambia tus Jeffros por DarkJeffros dependiendo de la inflación actual",
    params: [
        {
            name: "darkjeffros", type: "NaturalNumber", optional: false
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
        const wanted = response.find(x => x.param === "darkjeffros").data;

        // Comando
        const maxDaysForDarkJeffros = Config.daysDarkJeffros;

        const user = await Users.findOne({
            user_id: author.id,
            guild_id: guild.id
        }) ?? await new Users({
            user_id: author.id,
            guild_id: guild.id
        }).save();

        // en caso de que no sea nivel 5 o superior
        let validation = await ValidateDarkShop(user, author);
        if(!validation[0]) return message.channel.send({embeds: [validation[1]]});

        let jeffros = user.economy.global.jeffros;

        // analizando inflación ¿a cuanto equivale un darkjeffro?
        const dark = await DarkShops.findOne({guild_id: guild.id}) ?? await DarkShopWork(client, guild.id);

        const inflation = dark.inflation.value;
        const darkjeffro = 200*inflation

        const totalJeffros = Math.floor(darkjeffro * wanted);

        let embed = new Discord.EmbedBuilder()
        .setAuthor(`Éxito`, Config.darkLogoPng)
        .setDescription(`**—** Se han restado **${Emojis.Jeffros}${totalJeffros.toLocaleString('es-CO')}**.
**—** Se añadieron **${Emojis.Dark}${wanted.toLocaleString("es-CO")}** a tu cuenta.`)
        .setFooter(`Para ver la duración de tus DarkJeffros usa '${prefix}darkstats'.`)
        .setColor(Colores.negro);

        let nope = new Discord.EmbedBuilder()
        .setAuthor(`Error`, Config.darkLogoPng)
        .setDescription(`**—** No tienes suficientes Jeffros para cambiar.
**—** Inflación: **${Emojis.Dark}1** = **${Emojis.Jeffros}${darkjeffro.toLocaleString('es-CO')}**
**—** Necesitas **${Emojis.Jeffros}${totalJeffros.toLocaleString('es-CO')}** para cambiar a **${Emojis.Dark}${wanted.toLocaleString('es-CO')}**.`)
        .setColor(Colores.negro);

        // verificar si tiene o no jeffros suficientes.
        if(totalJeffros > jeffros) return message.channel.send({embeds: [nope]});

        const hoy = new Date();
        const duration = Math.ceil(dark.inflation.duration) + Math.floor(Math.random() * maxDaysForDarkJeffros);
        let userdark = user.economy.dark;

        if(!userdark.duration || !userdark.dj_since){
            userdark.duration = duration;
            userdark.dj_since = hoy;
        }


        userdark.darkjeffros ? userdark.darkjeffros += wanted : userdark.darkjeffros = wanted;
        user.economy.global.jeffros -= totalJeffros;

        userdark.accuracy = !isNaN(userdark.accuracy) ? Number(userdark.accuracy) : Number((Math.random() * 15).toFixed(1));
        userdark.duration = !isNaN(userdark.duration) ? Number(userdark.duration) : duration;
        userdark.dj_since ?? hoy;
        
        await user.save();
        return message.channel.send({embeds: [embed]});
    }
}