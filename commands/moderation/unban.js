const { Command, Categories, Embed, LogReasons, ChannelModules, Log, ErrorEmbed } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "unban",
    desc: "Desbanear a un usuario por su ID",
    category: Categories.Moderation
});

command.addOption({
    type: "string",
    name: "usuario",
    desc: "La ID del usuario",
    req: true
});

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { usuario } = params;
    const { GlobalDatas } = models;

    const user = usuario.value;
    let bEmbed = new Embed()
        .defAuthor({ text: `Unban`, icon: interaction.guild.iconURL() })
        .defDesc(`**—** Usuario desbaneado: **${user}**.
**—** Moderador: **${interaction.user.tag}**.`)
        .defColor(Colores.verde);

    await GlobalDatas.findOneAndRemove({
        "info.type": "temporalGuildBan",
        "info.guild_id": interaction.guild.id,
        "info.userID": user
    });

    try {
        await interaction.guild.members.unban(user)

        new Log(interaction)
            .setReason(LogReasons.Ban)
            .setTarget(ChannelModules.ModerationLogs)
            .send({ embeds: [bEmbed] })

        return interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: "Se ha desbaneado al usuario"
                    }
                })
            ]
        })
    } catch (err) {
        return new ErrorEmbed(interaction, {
            type: "execError",
            data: {
                guide: "No se encontró a ese usuario baneado."
            }
        }).send();
    }

}

module.exports = command;