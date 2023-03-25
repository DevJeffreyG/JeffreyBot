const { Client, time } = require("discord.js");
const { Bases } = require("./src/resources");
const { ChannelModules } = require("./src/utils/Enums");

/**
 * 
 * @param {Client} client 
 */
module.exports = async (client) => {

    const Log = require("./src/utils/Log")

    var devGuild = await client.guilds.fetch(Bases.dev.guild)
        .catch(err => console.log("⚠️ DEV GUILD NOT FOUND!", err))

    var devChannels = await devGuild?.channels.fetch()
        .catch(err => console.log("⚠️ NOT POSSIBLE TO FETCH CHANNELS!", err));

    var crashChannel = devChannels.get(Bases.dev.crashes);

    var lastinter;
    var title = `**⚠️ ¡JEFFREY BOT HA CRASHEADO!** ⚠️\n`

    function updateInteractionHandler() {
        let guild = client.lastInteraction?.guild;
        let user = client.lastInteraction?.user;
        let channel = client.lastInteraction?.channel;

        lastinter = `\n\nLa última interacción registrada fue:
**—** En el servidor \`${guild?.name}\` (\`${guild?.id}\`)
**—** Por \`${user?.tag}\` (\`${user?.id}\`)
**—** En \`#${channel?.name}\` (\`${channel?.id}\`)
**—** Tipo de interacción: \`${client.lastInteraction?.type}\`
**—** Nombre del comando: \`${client.lastInteraction?.commandName}\`
**—** Tipo de componente: \`${client.lastInteraction?.componentType}\`
**—** CustomId: \`${client.lastInteraction?.customId}\`
**—** ID: \`${client.lastInteraction?.id}\`
**—** ${time(client.lastInteraction?.createdAt)}`
    }

    process.on('uncaughtException', err => {
        updateInteractionHandler();
        console.log(err);
        console.log(`Uncaught Exception: ${err.message}`)

        new Log()
            .setChannel(crashChannel)
            .setTarget(ChannelModules.ClientLogs)
            .send({ content: `${title}**uncaughtException** con el error: **${err}**.${lastinter}` })
            .then(() => {
                process.exit(1)
            })
    })

    process.on('unhandledRejection', (reason, promise) => {
        updateInteractionHandler();
        console.log('Unhandled rejection at', promise, `reason: ${reason.message}`)

        new Log()
            .setChannel(crashChannel)
            .setTarget(ChannelModules.ClientLogs)
            .send({ content: `${title}**Unhandled rejection** con la razón: **${reason}**.${lastinter}` })
            .then(() => {
                process.exit(1)
            })
    })

    process.on('beforeExit', code => {
        // Can make asynchronous calls
        setTimeout(() => {
            console.log(`Process will exit with code: ${code}`)
            process.exit(code)
        }, 100)
    })

    process.on('exit', code => {
        // Only synchronous calls
        console.log(`Process exited with code: ${code}`)
    })
}