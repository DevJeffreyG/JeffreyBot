const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../src/utils/");
const { Users, Shops, DarkShops } = require("mongoose").models;

const commandInfo = {
    name: "inventory",
    aliases: ["inv"],
    info: "Te muestra los items actualmente en tu inventario",
    params: [
        {
            name: "darkshop?", type: "Boolean", optional: true
        }
    ],
    userlevel: "USER",
    category: "ECONOMY"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const isDarkShop = response.find(x => x.param === "darkshop?").data || false;

        // Comando
        const user = await Users.findOne({
            user_id: author.id,
            guild_id: guild.id,
        }) ?? await new Users({
            user_id: author.id,
            guild_id: guild.id
        }).save();

        const shop = isDarkShop ? await DarkShops.findOne({
            guild_id: guild.id
        }) : await Shops.findOne({
            guild_id: guild.id
        });

        let noItems = new Discord.MessageEmbed()
        .setAuthor(`Error`, isDarkShop ? Config.darkLogoPng : Config.errorPng)
        .setDescription(`**—** No encontré ningún item asociado a esta cuenta...`)
        .setColor(isDarkShop ? Colores.negro : Colores.rojo);

        let itemsEmbed = new Discord.MessageEmbed()
        .setAuthor(`Items del usuario N°${author.id}`, author.displayAvatarURL())
        .setThumbnail(isDarkShop ? Config.darkLogoPng : Config.jeffreyguildIcon)
        .setFooter(`${prefix}use {ID} para usar un item.`)
        .setColor(isDarkShop ? Colores.negro : Colores.verde);

        user.data.inventory.forEach(item => {
            const real_item = shop && shop.items.length > 0 ? shop.items.find(x => x.id === item.item_id) : null;
            if(real_item && item.isDarkShop === isDarkShop) itemsEmbed.addField(`— ${real_item.name}`, `**— Activo**: \`${item.active ? "sí" : "no"}\`.\n**— ID**: \`${item.use_id}\`.`)
        });

        if(user.data.inventory.filter(x => x.isDarkShop === isDarkShop).length === 0) return message.channel.send({embeds: [noItems]});

        let msg = await message.channel.send({embeds: [itemsEmbed]});

        if(isDarkShop){
            setTimeout(() => {
                message.delete();
                msg.delete()
            }, ms("15s"))
        }
    }
}