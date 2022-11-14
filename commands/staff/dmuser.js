const { Command, Categories, Embed, ErrorEmbed } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "dmuser",
    desc: "Enviar un mensaje directo al usuario como STAFF anónimamente",
    category: Categories.Staff
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

    if (usuario.user.bot) return interaction.editReply({ content: "No le voy a enviar un mensaje a un bot, perdona." })

    let yoStr = mensaje.value.replace(new RegExp('{yo}', "g"), `**${interaction.user.tag}**`);
    let final = yoStr.replace(new RegExp('{user}', "g"), `**${usuario.user.tag}**`)

    let embed = new Embed()
        .defAuthor({ text: "Hola:", icon: client.EmojisObject.Hola.url })
        .defDesc(final)
        .defFooter({ text: "Este es un mensaje directamente del staff del servidor." })
        .defColor(Colores.verde);

    try {
        await usuario.member.send({ embeds: [embed] })
        interaction.editReply({
            content: null, embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: `Se envió el mensaje por privado`
                    }
                })
            ]
        })
    } catch (e) {
        interaction.editReply({ embeds: [new ErrorEmbed({ type: "notSent", data: { tag: usuario.user.tag, error: e } })] })
    }

}

module.exports = command;