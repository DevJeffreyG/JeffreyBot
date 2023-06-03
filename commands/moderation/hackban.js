const { Command, Categories, Embed } = require("../../src/utils")

const command = new Command({
    name: "hackban",
    desc: "Banea a un usuario que no está en el servidor"
});

command.addOption({
    type: "string",
    name: "usuario",
    desc: "La ID del usuario",
    req: true
});

command.addOption({
    type: "string",
    name: "razon",
    desc: "La razón del baneo",
    req: false
});

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { usuario, razon } = params;

    const user = usuario.value;
    const reason = razon ? razon.value : "HackBan";

    await interaction.guild.members.ban(user, { reason })

    return interaction.editReply({
        embeds: [
            new Embed({
                type: "success",
                data: {
                    desc: "Se ha baneado al usuario"
                }
            })
        ]
    })
}

module.exports = command;