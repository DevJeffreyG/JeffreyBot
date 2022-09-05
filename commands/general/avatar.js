const { Command, Categories, Embed } = require("../../src/utils");
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "avatar",
    desc: "Muestra tu avatar o el de otro en el server",
    category: Categories.General
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
    .defAuthor({text: member.user.tag, icon: member.displayAvatarURL()})
    .setImage(member.displayAvatarURL({extension: "png", dynamic: true, size: 1024 }))
    .defColor(Colores.verde);

    return interaction.reply({embeds: [embed]});
}

module.exports = command;