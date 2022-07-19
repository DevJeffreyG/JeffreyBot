const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, GeneratePages, InteractivePages } = require("../../src/utils/");
const { Users, Shops } = require("mongoose").models;

const commandInfo = {
    name: "shop",
    aliases: ["tienda", "jeffreyshop", "items"],
    info: "Visualiza los items de la tienda",
    userlevel: "USER",
    category: "ECONOMY"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando
        const user = await Users.findOne({
            user_id: author.id,
            guild_id: guild.id
        });

        const shop = await Shops.findOne({
            guild_id: guild.id
        });

        if(!shop || shop.items.length === 0) return message.reply("Aún estamos cerrados, vuelve más tarde.");

        const pages = await GeneratePages(guild.id, message, 3, false);

        const base = {
            title: `Shop`,
            icon: author.displayAvatarURL(),
            description: `**—** ¡Bienvenid@ a la tienda! para comprar items usa \`${prefix}buy <ID del item>\`.
            **—** Tienes ${Emojis.Jeffros}**${user.economy.global.jeffros.toLocaleString("es-CO")}**`,
            footer: `Tienda oficial - Página {ACTUAL} de {TOTAL}`,
            icon_footer: guild.iconURL()
        }

        let embed = new Discord.EmbedBuilder()
        .setAuthor(base.title, base.icon)
        .setColor(Colores.verde)
        .setDescription(`${base.description}\n\n${pages[0].join(" ")}`)
        .setFooter(base.footer.replace(new RegExp("{ACTUAL}", "g"), `1`).replace(new RegExp("{TOTAL}", "g"), `${pages.length}`), base.icon_footer);
        
        let msg = await message.reply({embeds: [embed]});

        await InteractivePages(message, msg, pages, base);
    }
}