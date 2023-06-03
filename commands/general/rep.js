const { Command, Categories, ErrorEmbed, Embed, Cooldowns, GetRandomItem } = require("../../src/utils")
const { Colores } = require("../../src/resources");
const { SelfExec } = require("../../src/errors");

const command = new Command({
    name: "rep",
    desc: "Dale un punto de reputación a un usuario que se lo merezca!",
    helpdesc: "Da un punto de reputación a un usuario"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "A quién le vas a dar el punto de reputación",
    req: true
})


command.execute = async (interaction, models, params, client) => {
    const guild = interaction.guild;
    const author = interaction.user;

    const { usuario } = params;
    const { Users } = models;

    const member = usuario.member;

    if (member.id === author.id) throw new SelfExec(interaction);

    const user = await Users.getWork({ user_id: member.id, guild_id: guild.id });
    const user_author = params.getUser();

    let cool = await user_author.cooldown(Cooldowns.Rep);

    if (cool) return interaction.reply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    await user.addRep(1)

    const messages = [
        "Deben de ser buenos",
        "Seguro no están tramando nada",
        "¡Qué buenos que son!",
        "Lo merecerán, eso está claro"
    ];

    return interaction.reply({
        content: `${author} ➡️ ${member} ✨`, embeds: [
            new Embed()
                .defAuthor({ text: "☄️ +Rep", title: true })
                .defDesc(`**¡${author} le ha dado un punto de reputación a ${member}!**
__✨ ${GetRandomItem(messages)} ✨__`)
                .defColor(Colores.verde)
                .defThumbnail(member.displayAvatarURL())
        ]
    })
}

module.exports = command;