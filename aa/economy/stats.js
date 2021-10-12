const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "stats",
    aliases: ["perfil", "estadisticas", "estadísticas", "jeffros", "exp", "nivel"],
    info: "Te muestro las estadísticas tuyas o de algún usuario",
    params: [
        {
            name: "miembro", type: "Member", optional: true
        }
    ],
    userlevel: "USER",
    category: "ECONOMY"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, member, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const _member = response.find(x => x.param === "miembro").data || member;

        // Comando
        let user = await User.findOne({
            user_id: _member.id,
            guild_id: guild.id
        });

        let actualJeffros = user ? user.economy.global.jeffros : 0;
        let curExp = user ? user.economy.global.exp : 0;
        let curLvl = user ? user.economy.global.level : 0;
        let rep = user ? user.economy.global.reputation : 0;
            
        let nxtLvlExp = 10 * (curLvl ** 2) + 50 * curLvl + 100; // fórmula de MEE6. 5 * (level ^ 2) + 50 * level + 100

        let bdData = user.data.birthday;

        let dataExists = bdData ? true : false;
        let bdString = "";

        if(dataExists && bdData.locked){
            day = bdData.day;
            month = bdData.month;

            switch(month){
                case 1:
                    month = "Enero"
                    break;

                case 2:
                    month = "Febrero"
                    break;

                case 3:
                    month = "Marzo"
                    break;

                case 4:
                    month = "Abril"
                    break;

                case 5:
                    month = "Mayo"
                    break;

                case 6:
                    month = "Junio"
                    break;

                case 7:
                    month = "Julio"
                    break;

                case 8:
                    month = "Agosto"
                    break;

                case 9:
                    month = "Septiembre"
                    break;

                case 10:
                    month = "Octubre"
                    break;

                case 11:
                    month = "Noviembre"
                    break;

                case 12:
                    month = "Diciembre"
                    break;

                default:
                    month = null;
                    break;
            }

            bdString = (day != null) && (month != null) ? `**— Cumpleaños**: ${day} de ${month}.` : "";
        }

        let meEmbed = new Discord.MessageEmbed()
        .setAuthor(`| Estadísticas de ${_member.user.tag}`, _member.user.displayAvatarURL())
        .setDescription(`**— Nivel**: ${curLvl}
**— EXP**: ${curExp} / ${nxtLvlExp}.
**— Jeffros**: **${Emojis.Jeffros}${actualJeffros.toLocaleString('es-CO')}**.
**— Reputación**: ${rep}.
${bdString}`)
        .setThumbnail(Config.jeffreyguildIcon)
        .setColor(Colores.verde);

        return message.channel.send({embeds: [meEmbed]});
    }
}