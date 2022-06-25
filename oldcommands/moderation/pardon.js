const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");

const { Initialize, TutorialEmbed, Confirmation } = require("../../src/utils/");
const { Users } = require("mongoose").models;

const commandInfo = {
    name: "pardon",
    aliases: ["unwarn", "unsoftwarn", "uw", "us"],
    info: "Eliminar un softwarn, o un warn por su id",
    params: [
        {
            name: "id", display: "id de la infraccion", type: "Number", optional: false
        },
        {
            name: "softwarn?", display: "es un softwarn?", type: "Boolean", optional: true
        }
    ],
    userlevel: "STAFF",
    category: "MODERATION"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const id = response.find(x => x.param === "id").data;
        const isSoftwarn = response.find(x => x.param === "softwarn?").data || false;
        let textInfraction = isSoftwarn ? "Softwarn" : "Warn";

        // Comando
        let idsNow = []; // ids en uso actualmente para el tipo de infraccion a quitar
        let users = await Users.find();

        if(!isSoftwarn){ // buscar la id de los warns
            for (let i = 0; i < users.length; i++) {
                const document = users[i];
                
                let warns = document.warns;

                warns.forEach(warn => {
                    idsNow.push({id: warn.id, user_id: document.user_id, guild_id: document.guild_id}); // pushear cada id en uso
                });
            }
        } else { // bucsar la id de los SOFTWARNS
            for (let i = 0; i < users.length; i++) {
                const document = users[i];
                
                let softwarns = document.softwarns;

                softwarns.forEach(softwarn => {
                    idsNow.push({id: softwarn.id, user_id: document.user_id, guild_id: document.guild_id}); // pushear cada id en uso
                });
            }
        }

        let idFound = idsNow.find(x => x.id === id);

        let notFound = new Discord.MessageEmbed()
        .setAuthor(`Pardon ${textInfraction}: Error`, Config.errorPng)
        .setDescription(`**—** No existe el ${textInfraction} con id "**${id}**".`)
        .setFooter(`Verifica que estés usando el ID correcto, en warns o en softwarns.`, guild.iconURL())
        .setColor(Colores.rojo);

        if(!idFound) return message.channel.send({embeds: [notFound]});

        // si hay una id, proseguir
        let user = await Users.findOne({
            user_id: idFound.user_id,
            guild_id: idFound.guild_id
        });

        const guild_member = client.guilds.cache.find(x => x.id === user.guild_id);
        const member = guild_member ? guild_member.members.cache.find(x => x.id === user.user_id) : null;

        let memberNotFound = new Discord.MessageEmbed()
        .setAuthor(`Pardon ${textInfraction}: Error`, Config.errorPng)
        .setDescription(`**—** No pude encontrar al miembro "${idFound.user_id}" en este servidor.`)
        .setColor(Colores.rojo);

        if(!member || guild_member != guild) return message.channel.send({embeds: [memberNotFound]});

        let toConfirm = [
            `¿Estás segur@ de eliminar el ${textInfraction } al miembro ${member}?`,
            `Con ID: **${id}**.`
        ];

        let confirmation = await Confirmation(`Pardon ${textInfraction}`, toConfirm, message);

        if(!confirmation) return;

        const infractions = isSoftwarn ? user.softwarns : user.warns;

        const index = infractions.findIndex(x => x.id === id);

        infractions.splice(index, 1); // eliminar la infraccion
        await user.save();

        let pardon = new Discord.MessageEmbed()
        .setAuthor(`Pardon ${textInfraction}`, Config.bienPng)
        .setDescription(`**—** Miembro: ${member}
**—** ${textInfraction+"s"} actuales: **${infractions.length}**.`)
        .setColor(Colores.verde);

        confirmation.edit({embeds: [pardon]});

        let memberEmbed = new Discord.MessageEmbed()
        .setAuthor(`Pardon`, "https://cdn.discordapp.com/emojis/537004318667177996.png")
        .setDescription(`**—** Se ha eliminado el ${textInfraction} con ID "**${id}**".
**—** ${textInfraction+"s"} actuales: **${infractions.length}**.`)
        .setColor(Colores.verde)
        .setFooter(`Un abrazo, el Staff.`, 'https://cdn.discordapp.com/attachments/464810032081666048/503669825826979841/DiscordLogo.png');
        
        member.send({embeds: [memberEmbed]})
        .catch(e => {
            console.log(e)
            message.react("494267320097570837");
            message.channel.send("¡Usuario con MDs desactivados // Usuario no encontrado! // ERROR** ¡No se envió el mensaje!**");
        });
    }
}