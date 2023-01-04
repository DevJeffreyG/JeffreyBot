const { Bases } = require("../src/resources");

const { GlobalDatas } = require("mongoose").models;
const Chance = require("chance");

const Managers = require("../src/utils/Managers");
const CustomEmojis = require("../src/utils/CustomEmojis");
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
    client.totalMembers = 0;
    client.CustomEmojis = new Map();
    client.getCustomEmojis = (guildid) => { return client.CustomEmojis.get(guildid) };

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
    for (const partial of guilds.values()) {
        const guild = await partial.fetch();
        await guild.members.fetch();

        const customemojis = await new CustomEmojis(guild).build();

        client.CustomEmojis.set(guild.id, customemojis.emojis);

        client.totalMembers += guild.memberCount;

        // invitaciones
        let invites = await guild.invites.fetch();

        invites.forEach(invite => {
            client.invites[invite.code] = invite.uses;
        })

        new CronJob("0 */1 * * * *", async function () {
            functions.GlobalDatasWork(guild);
        }, null, true, "America/Bogota", null, true);
    }

    // Cada minuto
    new CronJob("0 */1 * * * *", async function () {
        functions.ActivityWork(client)
    }, null, true, "America/Bogota", null, true);

    // Cada 5 minutos
    functions.ManageDarkShops(client)
    new CronJob("0 */5 * * * *", async function () {
        // TODO: functions.ManageDarkShops(client)
    }, null, true, "America/Bogota", null, true);

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