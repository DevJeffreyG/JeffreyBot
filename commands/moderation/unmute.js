const { Command, Categories, Embed } = require("../../src/utils")

const command = new Command({
    name: "unmute",
    desc: "Quita el mute a un usuario"
});

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario a mutear",
    req: true
});

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { usuario } = params;

    const user = usuario.member;

    await user.timeout(null);

    return interaction.editReply({
        embeds: [
            new Embed({
                type: "success",
                data: {
                    desc: "Se ha desmuteado al usuario"
                }
            })
        ]
    })
}

module.exports = command;