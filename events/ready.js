const { Bases, Config } = require("../src/resources");
const { prefix } = Config;

const { GlobalDatas } = require("mongoose").models;
const Chance = require("chance");

const Managers = require("../src/utils/Managers");
let functions = require("../src/utils/functions");
const { ChannelModules } = require("../src/utils/Enums");
const Log = require("../src/utils/Log");

const CronJob = require("cron").CronJob;

module.exports = async (client) => {
    client.invites = [];
    client.logsFetched = {};
    client.activeCollectors = [];
    client.fetchedGuilds = [];
    client.blackjackCards = [];
    client.wonBlackjack = [];
    client.lockedGuilds = await GlobalDatas.getLockedGuilds();

    client.devGuild = await client.guilds.fetch(Bases.dev.guild)
        .catch(err => console.log("⚠️ DEV GUILD NOT FOUND!", err))

    var devChannels = await client.devGuild.channels.fetch()
        .catch(err => console.log("⚠️ NOT POSSIBLE TO FETCH CHANNELS!", err));

    client.crashChannel = await devChannels.get(Bases.dev.crashes);
    client.logChannel = await devChannels.get(Bases.dev.logs);

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

    let dsChannel = client.channels.cache.find(x => x.id === Config.dsChannel);
    let dsNews;

    if (client.user.id === Config.testingJBID) {
        guild = client.guilds.cache.find(x => x.id === "482989052136652800");
        dsNews = guild.roles.cache.find(x => x.id === "790431614378704906");
        dsChannel = client.channels.cache.find(x => x.id === "790431676970041356");
    } else {
        dsNews = guild.roles.cache.find(x => x.id === Config.dsnews);
    }

    new Log()
        .setChannel(client.logChannel)
        .setTarget(ChannelModules.ClientLogs)
        .send({ content: `${client.Emojis.Check} Jeffrey Bot ONLINE.` });

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