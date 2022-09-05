const { Command, Categories, Embed} = require("../../src/utils")
const { Config, Colores } = require("../../src/resources")

const command = new Command({
    name: "hackban",
    desc: "Banea a un usuario que no está en el servidor",
    category: Categories.Moderation
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

    const { usuario, razon} = params;

    const user = usuario.value;
    const reason = razon ? razon.value : "HackBan";
    let logC = client.user.id === Config.testingJBID ? interaction.guild.channels.cache.find(x => x.id === "483108734604804107") : interaction.guild.channels.cache.find(x => x.id === Config.logChannel);

    let bEmbed = new Embed()
    .defAuthor({text: `HackBan`, icon: interaction.guild.iconURL()})
    .defDesc(`**—** Usuario baneado: **${user}**.
**—** Moderador: **${interaction.user.tag}**.
**—** Razón: ${reason}.`)
    .defColor(Colores.verde);
    
    await interaction.guild.members.ban(user, {reason})
    logC.send({embeds: [bEmbed]});
    return interaction.editReply({embeds: [
        new Embed({
            type: "success",
            data: {
                desc: "Se ha baneado al usuario"
            }
        })
    ]})
}

module.exports = command;