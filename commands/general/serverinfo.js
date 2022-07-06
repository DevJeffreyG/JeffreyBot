const { Command, Embed} = require("../../src/utils");
const { Colores } = require("../../src/resources");
const { time } = require("@discordjs/builders");

const command = new Command({
    name: "serverinfo",
    desc: "Obtén información (casi) útil del servidor",
    category: "GENERAL"
})

command.execute = async (interaction, models, params, client) => {
    const { Guilds } = models;

    const guild = await Guilds.getById(interaction.guild.id);
    const adminroles = guild.getAdmins();
    const staffroles = guild.getStaffs();

    let serverembed = new Embed()
    .defAuthor({text: `Información del server — ${interaction.guild.name}`, title: true})
    .defColor(Colores.verde)
    .defThumbnail(interaction.guild.iconURL())
    .defDesc(`**— Creado el:** ${time(interaction.guild.createdAt)}
**— Tú te uniste el:** ${time(interaction.member.joinedAt)}
**— Miembros totales:** ${interaction.guild.memberCount}`)
    .setTimestamp()

    let admins = "";
    adminroles.forEach(roleId => {
        let r = interaction.guild.roles.cache.find(x => x.id === roleId);

        admins += r.members.map(user => user).length > 0 ? r.members.map(user => user) : "Que silencio por aquí...";
        serverembed.defField(`— @${r.name}`, admins);
    })

    let mods = "";
    staffroles.forEach(roleId => {
        let r = interaction.guild.roles.cache.find(x => x.id === roleId);

        mods += r.members.map(user => user).length > 0 ? r.members.map(user => user) : "Que silencio por aquí...";
        serverembed.defField(`— @${r.name}`, mods);
    })
    
    return interaction.reply({content: null, embeds: [serverembed]});
}

module.exports = command;