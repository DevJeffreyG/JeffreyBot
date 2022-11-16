const { Bases, Config } = require("../src/resources");

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

    // conteo
    let totalMembers = 0;
    for (const partial of guilds.values()) {
        const guild = await partial.fetch();
        await guild.members.fetch();


        totalMembers += guild.memberCount;

        // invitaciones
        let invites = await guild.invites.fetch();

        invites.forEach(invite => {
            client.invites[invite.code] = invite.uses;
        })

        functions.GlobalDatasWork(guild)

        new CronJob("1 * * * * *", async function () {
            functions.GlobalDatasWork(guild);
        }, null, true, "America/Bogota");
    }

    client.user.setActivity(`/ayuda - ${totalMembers} usuarios🔎`);

    console.log("============================================================");
    console.log(`❗❗❗ 💚 ${client.user.username} ONLINE 💚 ❗❗❗`);

    new Log()
        .setChannel(client.logChannel)
        .setTarget(ChannelModules.ClientLogs)
        .send({ content: `${client.Emojis.Check} Jeffrey Bot ONLINE.` });
    console.log("=================== LOGS =======================")

    /* YOUTUBE NOTIFACTIONS */

    functions.handleUploads(client);
}