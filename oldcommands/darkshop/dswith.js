const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, DarkShopWork, ValidateDarkShop } = require("../../src/utils/");
const { Users, DarkShops } = require("mongoose").models;

const commandInfo = {
    name: "dswith",
    aliases: ["dswithdraw", "with", "withdraw", "dwith"],
    info: "Cambia tus DarkJeffros por Jeffros dependiendo de la inflación actual",
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
        
        const changing = response.find(x => x.param === "darkjeffros").data;

        // Comando
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

        // analizando inflación ¿a cuanto equivale un darkjeffro?
        const dark = await DarkShops.findOne({guild_id: guild.id}) ?? await DarkShopWork(client, guild.id);

        const inflation = dark.inflation.value;
        const darkjeffro = 200*inflation;

        const has = user.economy.dark.darkjeffros ?? 0;
        const totalJeffros = Math.floor(darkjeffro * changing);

        let embed = new Discord.EmbedBuilder()
        .setAuthor(`Éxito`, Config.darkLogoPng)
        .setDescription(`**—** Se han restado **${Emojis.Dark}${changing}** de tu cuenta.
**—** Se añadieron **${Emojis.Jeffros}${totalJeffros.toLocaleString('es-CO')}**.`)
        .setColor(Colores.negro);

        let nope = new Discord.EmbedBuilder()
        .setAuthor(`Error`, Config.darkLogoPng)
        .setDescription(`**—** No tienes tantos DarkJeffros para cambiar.
**—** Quieres cambiar: **${Emojis.Dark}${changing.toLocaleString('es-CO')}**.
**—** Tienes: **${Emojis.Dark}${has.toLocaleString('es-CO')}**.`)
        .setColor(Colores.negro);

        // verificar si tiene o no jeffros suficientes.
        if(changing > has) return message.channel.send({embeds: [nope]});

        user.economy.global.jeffros += totalJeffros;
        user.economy.dark.darkjeffros -= changing;

        await user.save();

        return message.channel.send({embeds: [embed]});
    }
}