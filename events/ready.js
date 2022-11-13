const Config = require("../src/resources/base.json");
const { prefix } = Config;

const { GlobalDatas } = require("mongoose").models;
const Chance = require("chance");

const Managers = require("../src/utils/Managers");
let functions = require("../src/utils/functions");
const { Tendencies, Enum } = require("../src/utils/Enums");

const CronJob = require("cron").CronJob;

module.exports = async (client) => {
    client.invites = [];
    client.logsFetched = {};
    client.activeCollectors = [];
    client.fetchedGuilds = [];
    client.blackjackCards = [];
    client.wonBlackjack = [];
    client.lockedGuilds = await GlobalDatas.getLockedGuilds();

    new Chance().mixin({
        "prob": function (array) {
            let float = new Chance().floating({ min: 0, max: 1 });

            const expanded = array.flatMap(i => Array(i.likelihood).fill(i));

            /* console.log("⚪ Using:")
            console.log(expanded)
            console.log("⚪ Lenght: %s", expanded.length);

            array.forEach(i => {
                console.log(expanded.filter(x => x.item === i.item).length)
            }) */

            return expanded[Math.floor(float * expanded.length)].item;
        }
    })

    // default emojis
    let managers = await new Managers(client).prepare();
    client.EmojisObject = managers.emojis;
    client.Emojis = await managers.emojis_mentionable();

    // para cada guild fetchear(?
    let guilds = await client.guilds.fetch();
    let guild = client.guilds.cache.find(x => x.id === Config.jgServer);

    // conteo
    let totalMembers = 0;
    for (const key of guilds.keys()) {
        let actualGuild = client.guilds.cache.find(x => x.id === key);
        actualGuild.members.fetch();

        totalMembers += actualGuild.memberCount;

        // invitaciones
        let invites = await actualGuild.invites.fetch();

        invites.forEach(invite => {
            client.invites[invite.code] = invite.uses;
        })
    }

    client.user.setActivity(`${prefix}ayuda - ${totalMembers} usuarios🔎`);

    console.log("============================================================");
    console.log(`❗❗❗ 💚 ${client.user.username} ONLINE 💚 ❗❗❗`);

    let channel = client.channels.cache.get(Config.logChannel);
    let dsChannel = client.channels.cache.find(x => x.id === Config.dsChannel);
    let dsNews;

    if (client.user.id === Config.testingJBID) {
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

    console.log("🔄 Ciclo de Global Datas iniciado por primera vez")
    console.log("=================== LOGS =======================")
    functions.intervalGlobalDatas(client);

    /* ############ GLOBAL DATAS ############ */
    new CronJob("1 * * * * *", async function () {
        functions.intervalGlobalDatas(client);
    }, null, true, "America/Bogota");

    /* YOUTUBE NOTIFACTIONS */

    functions.handleUploads(client);
}