const Config = require("./../base.json");
const Colores = require("./../resources/colores.json");
const Emojis = require("./../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    "name": "dbuser",
    "info": "Busca la información que tiene JeffreyBot de un usuario en la base de datos.",
    "params": [
        {
            "name": "miembro", "type": "Member", "optional": false
        },
        {
            "name": "query", "type": "Array", "split": ".", "optional": true
        }
    ]
}

module.exports.run = async (client, message, args) => {

    const { guild, author, staff_role} = await Initialize(client, message);

    if(!message.member.roles.cache.find(x => x.id === staff_role.id)) return;

    const executionInfo = {
        "guild": guild,
        "author": author,
        "message": message
    }

    let response = TutorialEmbed(commandInfo, executionInfo, args);

    if(!response[0]) return; // si es "null"

    const miembro = await response.find(x => x.param === "miembro").data;
    let q = await response.find(x => x.param === "query").data;

    let query = await User.findOne({
        user_id: miembro.id,
        guild_id: guild.id
    });

    if(q && q.length >= 1){
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];
            
            query = query[queryQ]
        }
    }

    message.channel.send(`**${miembro.user.tag}**\n\`\`\`json\n${query}\n\`\`\``);

}

module.exports.help = {
    name: commandInfo.name
}
