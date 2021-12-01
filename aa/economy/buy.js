const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, Confirmation, ComprarItem, DeterminePrice } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");
const Shop = require("../../modelos/Shop.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "buy",
    aliases: ["comprar"],
    info: "Compra items de la shop normal",
    params: [
        {
            name: "id", display: "ID del item a comprar", type: "NaturalNumber", optional: false
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
        const id = response.find(x => x.param === "id").data;

        // Comando
        const user = await User.findOne({
            user_id: author.id,
            guild_id: guild.id
        });

        const shop = await Shop.findOne({
            guild_id: guild.id
        });

        if(!shop || shop.items.length === 0) return message.reply("Aún estamos cerrados, vuelve más tarde.");

        const item = shop.items.find(x => x.id === id);
        const itemPrecio = await DeterminePrice(user, item);
        const itemName = item.name;

        let toConfirm = [
            `¿Deseas comprar el item \`${itemName}\`?`,
            `Pagarás **${Emojis.Jeffros}${itemPrecio.toLocaleString("es-CO")}**.`,
            `Esta compra no se puede devolver.`
        ]

        let confirmation = await Confirmation("Comprar item", toConfirm, message);
        if(!confirmation) return;

        let buy = await ComprarItem(message, user, item, false);
        const error = !buy[0] ? true : false;
        const embed = buy[1];

        if(error) return confirmation.edit({embeds: [embed]});
        else
        return confirmation.edit({embeds: [embed]});
    }
}