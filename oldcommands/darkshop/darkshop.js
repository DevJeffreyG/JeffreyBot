const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, GeneratePages, InteractivePages, ValidateDarkShop } = require("../../src/utils/");
const { Users, DarkShops } = require("mongoose").models;

const commandInfo = {
    name: "darkshop",
    aliases: ["ds", "dark", "darks"],
    info: "Visualiza los items de la DarkShop",
    userlevel: "USER",
    category: "DARKSHOP"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const action = args[0] ?? null;
        
        // Comando

        const user = await Users.findOne({
            user_id: author.id,
            guild_id: guild.id
        }) ?? await new Users({
            user_id: author.id,
            guild_id: guild.id
        });

        const darkshop = await DarkShops.findOne({
            guild_id: guild.id
        });

        const darkjeffros = user.economy.dark.darkjeffros ?? 0;

        // en caso de que no sea nivel 5 o superior
        let validation = await ValidateDarkShop(user, author);
        if(!validation[0]) return message.channel.send({embeds: [validation[1]]});

        if(!darkshop || darkshop.items.length === 0) return message.reply("Todo lo que puedo ver es... oscuridad... vuelve más tarde...");

        if(action){ // borrar esto luego xd
            switch(action.toLowerCase()){
                case "help":
                case "ayuda":
                    message.reply(`Ya no existen subcomandos en el comando \`${prefix}darkshop\`, intenta usando \`${prefix}ayuda\`.`)
                    break;
    
                case "stats":
                case "bal":
                case "duration":
                    message.reply(`Ya no existen subcomandos en el comando \`${prefix}darkshop\`, intenta usando \`${prefix}darkstats\`.`)
                    break;
    
                case "change":
                    message.reply(`Ya no existen subcomandos en el comando \`${prefix}darkshop\`, intenta usando \`${prefix}dschange\`, alias \`${prefix}change\`.`)
                    break;
    
                case "with":
                case "withdraw":
                    message.reply(`Ya no existen subcomandos en el comando \`${prefix}darkshop\`, intenta usando \`${prefix}dswith\`, alias \`${prefix}with\`.`)
                    break;
    
                case "calc":
                    message.reply(`Ya no existen subcomandos en el comando \`${prefix}darkshop\`, intenta usando \`${prefix}dscalc\`, alias \`${prefix}calc\`.`)
                    break;
                
                case "estado":
                case "status":
                    message.reply(`Ya no existen subcomandos en el comando \`${prefix}darkshop\`, intenta usando \`${prefix}inflacion\`.`)
                    break;
    
                default:
                    message.reply(`Ya no existen subcomandos en el comando \`${prefix}darkshop\`, intenta usando \`${prefix}ayuda\` y mira los comandos en la categoría de la DarkShop.\nPara comprar items usa \`${prefix}dsbuy\`.`)
                    break;
            }

            return;
        }

        const pages = await GeneratePages(guild.id, message, 3, true);

        const base = {
            title: `DarkShop`,
            icon: Config.darkLogoPng,
            color: Colores.negro,
            description: `**—** Bienvenid@ a la DarkShop. Para comprar items usa \`${prefix}dsbuy <ID del item>\`\n**—** Esta tienda __**NO**__ usa los Jeffros convencionales.\n\n**—** Tienes ${Emojis.Dark}**${darkjeffros.toLocaleString("es-CO")}**`,
            footer: `DarkShop - Página {ACTUAL} de {TOTAL}`,
            icon_footer: guild.iconURL()
        }

        let embed = new Discord.EmbedBuilder()
        .setAuthor(base.title, base.icon)
        .setColor(base.color)
        .setDescription(`${base.description}\n\n${pages[0].join(" ")}`)
        .setFooter(base.footer.replace(new RegExp("{ACTUAL}", "g"), `1`).replace(new RegExp("{TOTAL}", "g"), `${pages.length}`), base.icon_footer);
        
        let msg = await message.reply({embeds: [embed]});

        await InteractivePages(message, msg, pages, base);
    }
}