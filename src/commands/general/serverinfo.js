const { Command, Embed, PrettyCurrency } = require("../../utils");
const { Colores } = require("../../resources");
const { time } = require("discord.js");

const command = new Command({
    name: "serverinfo",
    desc: "Obtén información del servidor"
})

command.execute = async (interaction, models, params, client) => {
    const doc = params.getDoc();
    const adminroles = doc.getAdmins();
    const staffroles = doc.getStaffs();

    let serverembed = new Embed()
        .defAuthor({ text: `Información del server — ${interaction.guild.name}`, title: true })
        .defColor(Colores.verde)
        .defThumbnail(interaction.guild.iconURL())
        .defDesc(`**— Creado el:** ${time(interaction.guild.createdAt)}
**— Tú te uniste el:** ${time(interaction.member.joinedAt)}
**— Miembros totales:** ${interaction.guild.memberCount}
**— El dueño es: ${await interaction.guild.members.fetch(interaction.guild.ownerId)}**
**— Tiene ${interaction.guild.emojis.cache.size} emojis**
**— Tiene ${interaction.guild.stickers.cache.size} stickers**
**— El promedio de ${client.getCustomEmojis(interaction.guild.id).Currency.name} es** ${PrettyCurrency(interaction.guild, Math.round(doc.data.average_currency))}`)

    let admins = "";
    adminroles.forEach(roleId => {
        let r = interaction.guild.roles.cache.get(roleId);
        if (!r) return;
        if (r.members.map(user => user).length === 0) return;

        admins += r.members.map(user => user);
        serverembed.defField(`— @${r.name}`, admins);
    })

    let mods = "";
    staffroles.forEach(roleId => {
        let r = interaction.guild.roles.cache.get(roleId);
        if (!r) return;
        if (r.members.map(user => user).length === 0) return;

        mods += r.members.map(user => user);
        serverembed.defField(`— @${r.name}`, mods);
    })

    return await interaction.reply({ content: null, embeds: [serverembed] });
}

module.exports = command;