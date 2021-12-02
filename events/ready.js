const Config = require("../base.json");
const { prefix } = Config;

let functions = require("../resources/functions.js");

const ms = require("ms");

module.exports = async (client) => {
    // para cada guild fetchear(?
    let guilds = await client.guilds.fetch();
    let guild = client.guilds.cache.find(x => x.id === Config.jgServer);
    //console.log(guilds);

    let totalMembers = 0;
    for(const key of guilds.keys()){
        let actualGuild = client.guilds.cache.find(x => x.id === key);
        actualGuild.members.fetch();

        totalMembers += actualGuild.memberCount;
    }

    client.user.setActivity(`${prefix}ayuda - ${totalMembers} usuarios🔎`);

    
    console.log(`${client.user.username} ONLINE`);

    let channel = client.channels.cache.get(Config.logChannel);
    let dsChannel = client.channels.cache.find(x => x.id === Config.dsChannel);
    let dsNews;

    if(client.user.id === Config.testingJBID){
        channel = client.channels.cache.get("483108734604804107");
        guild = client.guilds.cache.find(x => x.id === "482989052136652800");
        dsNews = guild.roles.cache.find(x => x.id === "790431614378704906");
        dsChannel = client.channels.cache.find(x => x.id === "790431676970041356");
    } else {
        dsNews = guild.roles.cache.find(x => x.id === Config.dsnews);
    }

    channel.send("Reviví.");

    /* Buscar usuarios nivel 5 sin role nivel 5 */
    await functions.findLvls5(client, guild)

    /* ############ GLOBAL DATAS ############ */
    console.log("Ciclo de Global Datas iniciado por primera vez")
    functions.intervalGlobalDatas(client);

    setInterval(function(){
        functions.intervalGlobalDatas(client);
    }, ms("1m"));

    /* YOUTUBE NOTIFACTIONS */

    functions.handleUploads(client);
}