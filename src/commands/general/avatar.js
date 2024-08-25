const { Command, Embed } = require("../../utils");
const { Colores } = require("../../resources");

const command = new Command({
    name: "avatar",
    desc: "Muestra tu avatar o el de otro en el server"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "Usuario a mostrar su avatar",
    req: false
})

command.execute = async (interaction, models, params, client) => {
    const { usuario } = params;
    const member = usuario ? usuario.member : interaction.member;

    let embed = new Embed()
        .defAuthor({ text: `${member.displayName} (${member.user.username})`, icon: member.displayAvatarURL() })
        .setImage(member.displayAvatarURL({ extension: "png", dynamic: true, size: 1024 }))
        .defColor(Colores.verde);

    return await interaction.reply({ embeds: [embed] });
}

module.exports = command;