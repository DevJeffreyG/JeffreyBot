const { Command, Embed, SendDirect, DirectMessageType } = require("../../src/utils")
const { Colores } = require("../../src/resources")
const { BadCommandError } = require("../../src/errors")

const command = new Command({
    name: "dmuser",
    desc: "Enviar un mensaje directo al usuario como STAFF anónimamente"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "Usuario al que se le va a enviar el mensaje",
    req: true
})

command.addOption({
    type: "string",
    name: "mensaje",
    desc: "Mensaje a enviar. Ponga '!' para ver los tags que se pueden usar en este comando",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { usuario, mensaje } = params;

    if (usuario.user.bot)
        throw new BadCommandError(interaction, "No se puede usar este comando en un bot.");

    let desc = mensaje.value
        .replace(new RegExp('{server}', "g"), `**${interaction.guild.name}**`)
        .replace(new RegExp('{ent}', "g"), `\n`)
        .replace(new RegExp('{user}', "g"), `**${usuario.user.username}**`)
        .replace(new RegExp('{displ}', "g"), `**${usuario.member.displayName}**`);

    let embed = new Embed()
        .defAuthor({ text: "v:", icon: client.EmojisObject.Hola.url })
        .defDesc(desc)
        .defFooter({ text: "Este mensaje fue escrito por una persona del STAFF de un servidor." })
        .defColor(Colores.verde);

    if (mensaje.value === "!")
        return await interaction.editReply({
            embeds: [
                new Embed()
                    .defColor(Colores.verdeclaro)
                    .defDesc(`# Ayuda con ${client.mentionCommand("dmuser")}`)
                    .fillDesc([
                        `Puedes usar varios **tags** al usar este comando y serán reemplazados así:`,
                        `\`{displ}\`: El nickname/nombre para mostrar que tiene el \`usuario\`. En este caso se reemplazaría por: **${usuario.member.displayName}**.`,
                        `\`{user}\`: El nombre de usuario que esté en \`usuario\`. En este caso se reemplazaría por: **${usuario.user.username}**.`,
                        `\`{server}\`: Nombre del servidor de donde se está enviado el mensaje. Útil para que el usuario sepa de donde viene el mensaje.`,
                        `\`{ent}\`: Para dejar una línea y escribir en la siguiente.`
                    ])
            ]
        })

    await SendDirect(interaction, usuario.member, DirectMessageType.Staff, { embeds: [embed] })
    await interaction.editReply({
        content: null, embeds: [
            new Embed({
                type: "success",
                data: {
                    desc: `Se envió el mensaje por privado`
                }
            })
        ]
    })


}

module.exports = command;