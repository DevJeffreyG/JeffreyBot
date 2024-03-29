const { Command, Categories, Embed, ErrorEmbed } = require("../../src/utils")

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

    await GlobalDatas.findOneAndRemove({
        "info.type": "temporalGuildBan",
        "info.guild_id": interaction.guild.id,
        "info.userID": user
    });

    try {
        await interaction.guild.members.unban(user)
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