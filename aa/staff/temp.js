const { Initialize, TutorialEmbed, LimitedTime, Confirmation, WillBenefit } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "temp",
    aliases: ["temprole", "tempboost", "addtemp", "addrole", "addboost"],
    info: "Agregar roles temporales o boosts temporales de cualquier tipo a algún usuario",
    params: [
        {
            name: "member", display: "miembro", type: "Member", optional: false
        },
        {
            name: "tipo", display: "role | boost", type: "Options", options: ["role", "boost"], optional: false
        },
        {
            name: "role", display: "id | @role", active_on: {param: "tipo", is: "role"}, type: "Role", optional: false
        },
        {
            name: "tiempo", active_on: {param: "tipo", is: "role"}, type: "Time", optional: false
        },
        {
            name: "tipo de boost", display: "boostMultiplier | boostProbabilities", active_on: { param: "tipo", is: "boost"}, type: "Options", options: ["boostMultiplier", "boostProbabilities"], optional: false
        },
        {
            name: "objetivo de boost", display: "jeffros | exp | all", active_on: { param: "tipo", is: "boost"}, type: "Options", options: ["jeffros", "exp", "all"], optional: false
        },
        {
            name: "multiplicador", display: "multiplicador (X que daría normalmente x multiplicador)", active_on: { param: "tipo", is: "boost"}, type: "Number", optional: false
        },
        {
            name: "tiempo", active_on: { param: "tipo", is: "boost"}, type: "Time", optional: false
        },
        {
            name: "role", active_on: { param: "tipo", is: "boost"}, type: "Role", optional: false
        }
    ],
    userlevel: "ADMIN",
    category: "STAFF"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando
        const member = response.find(x => x.param === "member").data;
        const tipo = response.find(x => x.param === "tipo").data;

        let user = await User.findOne({
            user_id: member.id,
            guild_id: guild.id
        });

        if(tipo === "role"){

            let role = response.find(x => x.param === "role").data;
            let tiempo = response.find(x => x.param === "tiempo").data;

            // llamar la funcion para hacer globaldata
            await LimitedTime(guild, role.id, member, user, tiempo);
            message.react("✅");
        } else if (tipo === "boost"){

            let btype = response.find(x => x.param === "tipo de boost").data;
            let bobj = response.find(x => x.param === "objetivo de boost").data;
            let multi = response.find(x => x.param === "multiplicador").data;
            let tiempo = response.find(x => x.param === "tiempo").data;
            let role = response.find(x => x.param === "role").data;

            let toConfirm = [
                `**${member.user.tag}** será BENEFICIADO AÚN MÁS si aplica este boost`,
                `¿Estás segur@ de proseguir aún así?`
            ];

            const willBenefit = await WillBenefit(member)
            let confirmation = true;
            
            if(willBenefit) {
                confirmation = await Confirmation("Continuar", toConfirm, message);
            }

            if(!confirmation) return;
            else confirmation.delete();
            
            // llamar la funcion para hacer un globaldata y dar el role con boost
            await LimitedTime(guild, role.id, member, user, tiempo, btype, bobj, multi);
            message.react("✅")
        } else {
            return message.channel.send({embeds: [embed]});
        }
    }
}