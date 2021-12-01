const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, Confirmation, ComprarItem, DeterminePrice, ValidateDarkShop } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");
const DarkShop = require("../../modelos/DarkShop.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "dsbuy",
    aliases: ["dscomprar", "darkshopbuy", "darkbuy"],
    info: "Compra items de la DarkShop",
    params: [
        {
            name: "id", display: "ID del item a comprar", type: "NaturalNumber", optional: false
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
        const id = response.find(x => x.param === "id").data;

        // Comando
        const user = await User.findOne({
            user_id: author.id,
            guild_id: guild.id
        }) ?? await new User({
            user_id: author.id,
            guild_id: guild.id
        }).save();

        const shop = await DarkShop.findOne({
            guild_id: guild.id
        });

        if(!shop || shop.items.length === 0) return message.reply("La oscuridad perdura... vuelve más tarde.");

        let validation = await ValidateDarkShop(user, author);
        if(!validation[0]) return message.channel.send({embeds: [validation[1]]});

        const item = shop.items.find(x => x.id === id);
        const itemPrecio = await DeterminePrice(user, item, false, true);
        const itemName = item.name;

        let toConfirm = [
            `¿Deseas comprar el item \`${itemName}\`?`,
            `Pagarás **${Emojis.Dark}${itemPrecio.toLocaleString("es-CO")}**.`,
            `Esta compra no se puede devolver.`
        ]

        let confirmation = await Confirmation("Comprar item", toConfirm, message);
        if(!confirmation) return;

        let buy = await ComprarItem(message, user, item, true);
        const error = !buy[0] ? true : false;
        const embed = buy[1];

        if(error) return confirmation.edit({embeds: [embed]});
        else
        return confirmation.edit({embeds: [embed]});
    }
}