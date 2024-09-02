const { Command, Embed, Cooldowns } = require("../../utils")
const { Colores } = require("../../resources");
const { SelfExec } = require("../../errors");

const Chance = require("chance");

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
    const author = interaction.member;

    const { usuario } = params;
    const { Users } = models;

    const member = usuario.member;

    if (member.id === author.id) throw new SelfExec(interaction);

    const user = await Users.getWork({ user_id: member.id, guild_id: guild.id });
    const user_author = params.getUser();

    let cool = await user_author.cooldown(Cooldowns.Rep);

    if (cool) return await interaction.reply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    await user.addRep(1)

    const messages = [
        "Debe de ser buen@",
        "Seguro no está tramando nada",
        "¡Qué buen@ que es!",
        "Lo merecerá, eso está claro"
    ];

    await interaction.reply({
        content: `${author} ➡️ ${member} ✨`, embeds: [
            new Embed()
                .defAuthor({ text: "☄️ +Rep", title: true })
                .defDesc(`**¡${author.displayName} le ha dado un punto de reputación a ${member.displayName}!**
__✨ ${new Chance().pickone(messages)} ✨__`)
                .defColor(Colores.verde)
                .defThumbnail(member.displayAvatarURL())
        ]
    })
}

module.exports = command;