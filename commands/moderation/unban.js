const { codeBlock } = require("discord.js");
const { DiscordLimitationError } = require("../../src/errors");
const { Command, Embed } = require("../../src/utils")

const command = new Command({
    name: "unban",
    desc: "Desbanear a un usuario por su ID"
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

    await GlobalDatas.findOneAndDelete({
        type: "temporalGuildBan",
        "info.guild_id": interaction.guild.id,
        "info.user_id": user
    });

    try {
        await interaction.guild.members.unban(user)
        await interaction.editReply({
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
        throw new DiscordLimitationError(interaction, "ban", [
            "No se pudo banear a este usuario",
            codeBlock(err)
        ])
    }

}

module.exports = command;