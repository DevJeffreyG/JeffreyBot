const { Bases } = require("../src/resources");

const { Collection, Client, time, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const Managers = require("../src/utils/Managers");
const CustomEmojis = require("../src/utils/CustomEmojis");
let functions = require("../src/utils/functions");
const { ChannelModules } = require("../src/utils/Enums");
const Log = require("../src/utils/Log");
const Embed = require("../src/utils/Embed");

const Commands = require("../Commands");

const CronJob = require("cron").CronJob;

/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    client.isOnLockdown = process.env.INIT_LOCKDOWN == "FALSE" ? false : true;
    client.invites = [];
    client.logsFetched = {};
    client.activeCollectors = [];
    client.fetchedGuilds = [];
    client.blackjackCards = [];
    client.wonBlackjack = [];
    client.totalMembers = 0;
    client.CustomEmojis = new Map();
    client.rawCommands = [];
    client.commands = new Collection();
    client.mapped = false; // Si ya se cargaron los comandos al client
    client.getCustomEmojis = (guildid) => { return client.CustomEmojis.get(guildid) };

    client.devGuild = await client.guilds.fetch(Bases.dev.guild)
        .catch(err => console.log("⚠️ DEV GUILD NOT FOUND!", err))

    var devChannels = await client.devGuild.channels.fetch()
        .catch(err => console.log("⚠️ NOT POSSIBLE TO FETCH CHANNELS!", err));

    client.crashChannel = await devChannels.get(Bases.dev.crashes);
    client.logChannel = await devChannels.get(Bases.dev.logs);

    if (!client.mapped) {
        const CommandsLoad = new Commands(["./commands/", "./contextmenus/"]);
        client = await CommandsLoad.map(client);
    }

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
        functions.ManageDarkShops(client)
    }, null, true, "America/Bogota", null, true);

    console.log("============================================================");
    console.log(`❗❗❗ 💚 ${client.user.username} ONLINE 💚 ❗❗❗`);

    new Log()
        .setChannel(client.logChannel)
        .setTarget(ChannelModules.ClientLogs)
        .send({
            embeds: [
                new Embed({
                    type: "success", data: {
                        title: "ONLINE",
                        desc: [
                            "Jeffrey Bot está **ONLINE**",
                            `**DEV MODE**: ${process.env.DEV === "TRUE" ? "`SÍ`" : "`NO`"}`,
                            `**v${client.version}**`,
                            `${time()}`
                        ]
                    }
                })
            ],
            components: [
                new ActionRowBuilder()
                    .setComponents(
                        new ButtonBuilder()
                            .setCustomId(`KILL-${client.readyTimestamp}-${client.user.id}`)
                            .setStyle(ButtonStyle.Danger)
                            .setLabel("Kill")
                    )
            ]
        });
    console.log("=================== LOGS =======================")

    /* YOUTUBE NOTIFACTIONS */

    functions.handleUploads(client);
}