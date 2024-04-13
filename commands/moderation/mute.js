const { Command, Embed } = require("../../src/utils")
const ms = require("ms");
const { codeBlock } = require("discord.js");
const { DiscordLimitationError } = require("../../src/errors");

const command = new Command({
    name: "mute",
    desc: "Mutea a un usuario"
});

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario a mutear",
    req: true
});

command.addOption({
    type: "string",
    name: "tiempo",
    desc: "Cuanto tiempo estará muteado (1d, 10s, 15m, etc)",
    req: true
});

command.addOption({
    type: "string",
    name: "razon",
    desc: "La razón del mute",
    req: false
});

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { usuario, tiempo, razon } = params;

    const user = usuario.member;
    const timeout = tiempo.value;
    const reason = razon?.value;

    try {
        await user.timeout(ms(timeout), reason)
    } catch (err) {
        throw new DiscordLimitationError(interaction, "timeout", ["Hubo un error intentando expulsar temporalmente a este usuario", codeBlock(err)]);
    }

    await interaction.editReply({
        embeds: [
            new Embed({
                type: "success",
                data: {
                    desc: "Se ha muteado al usuario"
                }
            })
        ]
    })
}

module.exports = command;