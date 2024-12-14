const { Bases } = require("../resources");

const { Collection, Client, time, chatInputApplicationCommandMention } = require("discord.js");
const { Guilds, GlobalDatas } = require("mongoose").models;

const Managers = require("../utils/Managers");
const { CustomEmojis, ChannelModules, Log, Embed } = require("../utils/");
const Functions = require("../utils/functions");

const Commands = require("../app/Commands");

const CronJob = require("cron").CronJob;

/**
 * @param {Client} client 
 */
module.exports = async (client) => {
    client.toggles = await GlobalDatas.getToggles();
    client.isOnLockdown = client.toggles.info.lockdown;
    client.invites = [];
    client.logsFetched = {};
    client.activeCollectors = [];
    client.fetchedGuilds = [];
    client.blackjackCards = [];
    client.wonBlackjack = [];
    client.petCombats = new Collection();
    client.totalMembers = 0;
    client.CustomEmojis = new Map();
    client.slashCooldowns = new Map();
    client.rawCommands = [];
    client.commands = new Collection();
    client.mapped = false; // Si ya se cargaron los comandos al client
    client.getCustomEmojis = (guildid) => { return client.CustomEmojis.get(guildid) };
    client.isThisFetched = (guildid) => { return client.fetchedGuilds.find(x => x === guildid) ? true : false }
    client.mentionCommand = (format) => {
        const args = format.split(" ");
        const name = args[0];
        const sub = args[1];
        const inside = args[2];

        let command = client.application.commands.cache.find(x => x.name === name);
        if (!command) {
            if(process.env.DEV === "FALSE") console.error("🔴 No se encontró el comando %s", format)
            return `\`/${format}\``;
        }

        if (inside) return chatInputApplicationCommandMention(name, sub, inside, command.id)
        else if (sub) return chatInputApplicationCommandMention(name, sub, command.id)
        else return chatInputApplicationCommandMention(name, command.id)
    }

    client.devGuild = await client.guilds.fetch(Bases.dev.guild)
        .catch(err => console.log("⚠️ DEV GUILD NOT FOUND!", err))

    var devChannels = await client.devGuild.channels.fetch()
        .catch(err => console.log("⚠️ NOT POSSIBLE TO FETCH CHANNELS!", err));

    client.crashChannel = devChannels?.get(Bases.dev.crashes);
    client.logChannel = devChannels?.get(Bases.dev.logs);

    // default emojis
    let managers = await new Managers(client).prepare();
    client.EmojisObject = managers.emojis;
    client.Emojis = await managers.emojis_mentionable();
    await client.application.commands.fetch();

    // para cada guild fetchear(?
    let guilds = await client.guilds.fetch();

    // conteo & cron jobs + emotes
    for await (const partial of guilds.values()) {
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
            try {
                await Functions.GlobalDatasWork(guild);
            } catch (err) {
                console.log("🔴 Hubo un error con las GlobalDatas");
                console.error(err);
            }
        }, null, true, "America/Bogota", null, process.env.DEV === "TRUE");

        new CronJob("*/30 * * * * *", async function () {
            try {
                await Functions.handleNotification(guild);
            } catch (err) {
                console.log("🔴 Hubo un error con las notificaciones")
                console.error(err);
            }
        }, null, true, "America/Bogota", null, process.env.DEV === "TRUE")

        // Cada hora
        new CronJob("0 0 */1 * * *", async function () {
            try {
                await Functions.PetWork(guild);
            } catch (err) {
                console.log("🔴 Hubo un error con las Mascotas")
                console.error(err);
            }
        }, null, true, "America/Bogota", null, false)

        // Cada semana
        new CronJob("0 0 0 * * 0", async function () {
            try {
                const doc = await Guilds.getWork(guild.id);

                // Ajustar el promedio
                let average = await Functions.FindAverage(guild)
                doc.data.average_currency = average;

                await doc.save();
            } catch (err) {
                console.log("🔴 Hubo un error con las semanales")
                console.error(err);
            }
        }, null, true, "America/Bogota", null, process.env.DEV === "TRUE")
    }

    if (!client.mapped) {
        const CommandsLoad = new Commands();
        client = await CommandsLoad.map(client);
    }

    // Cada minuto
    new CronJob("0 */1 * * * *", async function () {
        try {
            await Functions.ActivityWork(client)
        } catch (err) {
            console.log("🔴 Hubo un error con la actividad")
            console.error(err);
        }
    }, null, true, "America/Bogota", null, true);

    // Cada 5 minutos
    new CronJob("0 */5 * * * *", async function () {
        try {
            await Functions.ManageDarkShops(client)
        } catch (err) {
            console.log("🔴 Hubo un error con las DarkShops")
            console.error(err);
        }
    }, null, true, "America/Bogota", null, true);

    console.log("============================================================");
    console.log(`❗❗❗ 💚 ${client.user.displayName} ONLINE 💚 ❗❗❗`);

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
            ]
        });
    console.log("=================== LOGS =======================")
}