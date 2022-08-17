const { Command, Embed} = require("../../src/utils")
const { Config, Colores } = require("../../src/resources")

const command = new Command({
    name: "unban",
    desc: "Desbanear a un usuario por su ID",
    category: "MODERATION"
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
    let logC = client.user.id === Config.testingJBID ? interaction.guild.channels.cache.find(x => x.id === "483108734604804107") : interaction.guild.channels.cache.find(x => x.id === Config.logChannel);

    let bEmbed = new Embed()
    .defAuthor({text: `Unban`, icon: interaction.guild.iconURL()})
    .defDesc(`**—** Usuario desbaneado: **${user}**.
**—** Moderador: **${interaction.user.tag}**.`)
    .defColor(Colores.verde);

    await GlobalDatas.findOneAndRemove({
        "info.type": "temporalGuildBan",
        "info.guild_id": interaction.guild.id,
        "info.userID": user
    });
    
    await interaction.guild.members.unban(user)
    
    logC.send({embeds: [bEmbed]});
    return interaction.editReply({embeds: [
        new Embed({
            type: "success",
            data: {
                desc: "Se ha desbaneado al usuario"
            }
        })
    ]})
}

module.exports = command;