const { Client, time, codeBlock } = require("discord.js");
const { Bases } = require("../resources/");
const { ChannelModules } = require("../utils/");

/**
 * 
 * @param {Client} client 
 */
module.exports = async (client) => {

    const Log = require("../utils/Log")

    var devGuild = await client.guilds.fetch(Bases.dev.guild)
        .catch(err => console.log("⚠️ DEV GUILD NOT FOUND!", err))

    var devChannels = await devGuild?.channels.fetch()
        .catch(err => console.log("⚠️ NOT POSSIBLE TO FETCH CHANNELS!", err));

    var crashChannel = devChannels?.get(Bases.dev.crashes);

    var lastinter;
    var title = `# **⚠️ ¡JEFFREY BOT HA CRASHEADO!** ⚠️\n`

    function updateInteractionHandler() {
        let guild = client.lastInteraction?.guild;
        let user = client.lastInteraction?.user;
        let channel = client.lastInteraction?.channel;

        lastinter = `\n### La última interacción registrada fue:
**—** En el servidor \`${guild?.name}\` (\`${guild?.id}\`)
**—** Por \`${user?.username}\` (\`${user?.id}\`)
**—** En \`#${channel?.name}\` (\`${channel?.id}\`)
**—** Tipo de interacción: \`${client.lastInteraction?.type}\`
**—** Nombre del comando: \`${client.lastInteraction?.commandName}\`
**—** Tipo de componente: \`${client.lastInteraction?.componentType}\`
**—** CustomId: \`${client.lastInteraction?.customId}\`
**—** ID: \`${client.lastInteraction?.id}\`

-# ${time(client.lastInteraction?.createdAt)} **— v${client.version}**`
    }

    process.on('uncaughtException', (err, origin) => {
        updateInteractionHandler();
        console.error("🔴 (%s) %s", origin, err.stack);

        new Log()
            .setChannel(crashChannel)
            .setTarget(ChannelModules.ClientLogs)
            .send({ content: `${title}\`${origin}\`: **${err}**\n${codeBlock("js", err.stack)}${lastinter}` })
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