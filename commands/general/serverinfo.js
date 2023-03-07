const { Command, Categories, Embed} = require("../../src/utils");
const { Colores } = require("../../src/resources");
const { time } = require("discord.js");

const command = new Command({
    name: "serverinfo",
    desc: "Obtén información del servidor",
    category: Categories.General
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
**— Miembros totales:** ${interaction.guild.memberCount}
**— El dueño es: ${await interaction.guild.members.fetch(interaction.guild.ownerId)}**
**— Tiene ${interaction.guild.emojis.cache.size} emojis**
**— Tiene ${interaction.guild.stickers.cache.size} emojis**`)

    let admins = "";
    adminroles.forEach(roleId => {
        let r = interaction.guild.roles.cache.find(x => x.id === roleId);
        if(!r) return;
        if(r.members.map(user => user).length == 0) return;

        admins += r.members.map(user => user);
        serverembed.defField(`— @${r.name}`, admins);
    })

    let mods = "";
    staffroles.forEach(roleId => {
        let r = interaction.guild.roles.cache.find(x => x.id === roleId);
        if(!r) return;
        if(r.members.map(user => user).length == 0) return;

        mods += r.members.map(user => user);
        serverembed.defField(`— @${r.name}`, mods);
    })
    
    return interaction.reply({content: null, embeds: [serverembed]});
}

module.exports = command;