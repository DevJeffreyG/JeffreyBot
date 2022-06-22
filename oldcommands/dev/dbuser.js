const { Initialize, TutorialEmbed } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "dbuser",
    info: "Busca la información que tiene JeffreyBot de un usuario en la base de datos",
    params: [
        {
            name: "miembro", type: "Member", optional: false
        },
        {
            name: "query", type: "Array", split: ".", optional: true
        }
    ],
    userlevel: "DEVELOPER",
    category: "DEVELOPER"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){
        const { guild, staff_role, executionInfo} = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando

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
}