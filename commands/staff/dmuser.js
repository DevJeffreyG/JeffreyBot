const { Command, Categories, Embed, ErrorEmbed, SendDirect, DirectMessageType } = require("../../src/utils")
const { Colores } = require("../../src/resources")
const { DMNotSentError } = require("../../src/errors/")

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
    desc: "Mensaje a enviar. Usa {yo} para poner tu nombre, {user} para poner el tag de 'usuario'",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { usuario, mensaje } = params;
    const { Preferences } = models;

    if (usuario.user.bot) return interaction.editReply({ content: "No le voy a enviar un mensaje a un bot, perdona." })

    let yoStr = mensaje.value.replace(new RegExp('{yo}', "g"), `**${interaction.user.username}**`);
    let final = yoStr.replace(new RegExp('{user}', "g"), `**${usuario.user.username}**`)

    let embed = new Embed()
        .defAuthor({ text: "Hola:", icon: client.EmojisObject.Hola.url })
        .defDesc(final)
        .defFooter({ text: "Este es un mensaje directamente del STAFF del servidor." })
        .defColor(Colores.verde);

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