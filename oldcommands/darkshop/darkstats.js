const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const moment = require("moment");

const { Initialize, TutorialEmbed, DaysUntilToday, ValidateDarkShop } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "darkstats",
    aliases: ["dsstats", "dstats", "dsbal"],
    info: "Revisa tus DarkJeffros, su duración, y tu precisión o el de otro usuario",
    params: [
        {
            name: "miembro", type: "Member", optional: true
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
        const member = response.find(x => x.param === "miembro").data || message.member;

        // Comando
        const user = await User.findOne({
            user_id: member.id,
            guild_id: guild.id
        });

        // en caso de que no sea nivel 5 o superior
        let validation = await ValidateDarkShop(user, author);
        if(!validation[0]) return message.channel.send({embeds: [validation[1]]});

        const darkjeffros = user.economy.dark.darkjeffros.toLocaleString("es-CO") ?? "?";
        const accuracy = user.economy.dark.accuracy ?? "?";
        const total = user.economy.dark.duration ?? "?";

        const pastDays = await DaysUntilToday(user.economy.dark.dj_since ?? "ñ");

        const dj_since = moment(user.economy.dark.dj_since).tz("America/Bogota").format("DD/MM/YY hh:mmA");

        let statsEmbed = new Discord.MessageEmbed()
        .setAuthor(`Estadísiticas del usuario N°${member.id}`, member.user.displayAvatarURL())
        .setDescription(`**— DarkJeffros**: ${Emojis.Dark}${darkjeffros}.
**— Precisión**: ${accuracy}%
**— Duración de DarkJeffros**: \`${pastDays}\` de \`${total}\` días.
**— Desde**: ${dj_since != "Invalid date" ? dj_since : "?"}, **GMT-5**.
**— Items**: Usa \`${prefix}dsinventory\`.`)
        .setThumbnail(Config.darkLogoPng)
        .setColor(Colores.negro);

        return message.channel.send({embeds: [statsEmbed]})
    }
}