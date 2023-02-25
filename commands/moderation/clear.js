const { Command, Categories, Embed, ErrorEmbed, Log, LogReasons, ChannelModules } = require("../../src/utils")
const moment = require("moment-timezone");

const command = new Command({
    name: "clear",
    desc: "Elimina mensajes del chat",
    category: Categories.Moderation
});

command.addOption({
    type: "integer",
    name: "mensajes",
    desc: "El número de mensajes a eliminar",
    min: 1,
    req: true
});

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const { mensajes } = params;

    const total = mensajes.value;

    let count = 0;
    let toremove = total;

    while (toremove > 0) {
        console.log("-----------------------------------------")
        console.log("🗨️ Faltan %s msgs a eliminar", toremove)
        try {
            let actualremoval = toremove > 100 ? 100 : toremove;

            await interaction.channel.messages.fetch({ limit: actualremoval });

            // despues del fetch, conseguir solo los que son menos a 14 dias
            let messagesAvailable = interaction.channel.messages.cache.filter(
                x =>
                    moment(x?.createdAt).isAfter(moment().subtract(14, "days")) &&
                    (x.content?.length >= 1 || x.embeds?.length >= 1)
            )

            console.log("⚪ %s/%s mensajes son posibles de eliminar.", messagesAvailable.size, actualremoval)

            if (messagesAvailable.size < actualremoval) {
                actualremoval = messagesAvailable.size; // borrar solo los que se pueden
                toremove = 0; // para dejar de intentar borrar los mensajes
            }
            if (actualremoval === 0) break;

            console.log("💨 Eliminando %s mensajes ...", actualremoval)

            let removed = await interaction.channel.bulkDelete(actualremoval);
            console.log("🟢 Eliminados %s mensajes", removed.size)
            toremove -= removed.size;
            count += removed.size;
        } catch (err) {
            console.log(err)
            break;
        }
    }

    let dayserror = new ErrorEmbed(interaction, {
        type: "discordLimitation",
        data: {
            action: "bulkdelete mensajes viejos",
            help: "Sólo puedo eliminar mensajes que sean menores de 14 días"
        }
    })
    if (count === 0) return dayserror.send();

    new Log(interaction)
        .setReason(LogReasons.MsgClear)
        .setTarget(ChannelModules.ModerationLogs)
        .send({ content: `- **${interaction.user.tag}** ha eliminado ${count} mensajes en ${interaction.channel}.` })

    return interaction.editReply({
        embeds: [
            new Embed({
                type: "success",
                data: {
                    desc: `Eliminados **${count}** mensajes`
                }
            })
        ]
    });
}

module.exports = command;