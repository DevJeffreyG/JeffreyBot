const { Command, Categories, Embed, ErrorEmbed, } = require("../../src/utils")
const ms = require("ms");
const { codeBlock } = require("discord.js");

const command = new Command({
    name: "mute",
    desc: "Mutea a un usuario",
    category: Categories.Moderation
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
        return new ErrorEmbed(interaction, {
            type: "discordLimitation",
            data: {
                action: "timeout",
                help: `No pude expulsar temporalmente a este usuario:\n${codeBlock(err)}`
            }
        }).send();
    }

    return interaction.editReply({
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