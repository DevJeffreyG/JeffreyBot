const { GuildFeature, ChannelType, PermissionsBitField, time } = require("discord.js");
const { Command, Categories, Confirmation } = require("../../src/utils")

const command = new Command({
    name: "lockdown",
    desc: "Inicia el lockdown en el servidor",
    category: Categories.Administration
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { GlobalDatas } = models;

    const guild = interaction.guild;
    const Loading = client.Emojis.Loading;

    client.lockedGuilds = await GlobalDatas.getLockedGuilds();

    let locked = client.lockedGuilds;
    let thisLock = locked.find(x => x.info.guild === interaction.guild.id)?.info;

    if (thisLock) return unlock(); // togglear si ya está en lockdown
    thisLock = {
        guild: interaction.guild.id
    }

    let confirmation = await Confirmation("Lockdown", [
        "Se ocultarán TODOS los canales actuales para TODOS los roles del servidor.",
        "Para volver a la normalidad hay que volver a usar este comando.",
        "Se pausarán las invitaciones del servidor.",
        "Se creará un canal adicional al final donde los administradores pueden anunciar a los miembros, en el tema estará la situación actual del servidor."
    ], interaction);
    if(!confirmation) return;

    interaction.editReply({ content: `${Loading} Pausando invitaciones`, embeds: [] })
    try { await guild.edit({ features: interaction.guild.features.concat(GuildFeature.InvitesDisabled) }) } catch (err) { }

    interaction.editReply({ content: `${Loading} Obteniendo canales de texto y voz` })
    await guild.channels.fetch();

    interaction.editReply({ content: `${Loading} Obteniendo roles` })
    await guild.roles.fetch();

    // creacion de permisos denegados que va a tener cada role
    let revokedPermissions = [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.UseApplicationCommands,
        PermissionsBitField.Flags.ChangeNickname
    ]


    let data = [];

    // la forma en que se denegan los permisos a todos los roles del servidor
    guild.roles.cache.forEach(role => {
        data.push({
            id: role.id,
            deny: revokedPermissions,
            allow: []
        })
    })

    interaction.editReply({ content: `${Loading} Guardando los permisos actuales de todos los roles` })
    let originalPerms = [];

    // para cada uno de los canales
    guild.channels.cache.forEach(channel => {
        if (channel.type != ChannelType.GuildText && channel.type != ChannelType.GuildVoice) return;

        let perms = [];

        // tomar cada permiso actual en cada uno de los canales del servidor y guardar la informacion
        channel.permissionOverwrites.cache.forEach(perm => {
            perms.push({ id: perm.id, denied: perm.deny.toArray(), allowed: perm.allow.toArray() });
        })
        originalPerms.push({ channel: channel.id, perms })

        // denegar todos los permisos a cada role en el canal actual
        channel.permissionOverwrites.set(data, `[BULK] Lockdown por ${interaction.user.tag}`)
    })

    thisLock.originalPerms = originalPerms;

    interaction.editReply({ content: `${Loading} Creando nuevo canal de información` })
    let lockChannel = await guild.channels.create({
        name: "lockdown",
        type: ChannelType.GuildAnnouncement,
        topic: `El servidor fue puesto en lockdown el ${time(new Date())} por un administrador.\nPor favor vuelve más tarde, ¡disculpa las molestias!`,
        position: 0,
        permissionOverwrites: [{
            id: guild.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.AddReactions
            ],
            deny: [
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.CreatePublicThreads,
                PermissionsBitField.Flags.CreatePrivateThreads,
            ]
        }],
        reason: `[BULK] Lockdown por ${interaction.user.tag}`
    })

    thisLock.newChannel = lockChannel.id

    GlobalDatas.newLockedGuild(thisLock);

    return interaction.editReply({ content: `${client.Emojis.Check} Listo` })

    async function unlock() {
        console.log("🟢 Unlocking!")

        interaction.editReply({ content: `${Loading} Habilitando invitaciones` })
        try { await guild.edit({ features: interaction.guild.features.filter(x => x != GuildFeature.InvitesDisabled) }); } catch (err) { }

        await guild.channels.fetch();
        interaction.editReply({ content: `${Loading} Regresando los permisos a los canales` })
        
        // para cada uno de los canales
        guild.channels.cache.forEach(channel => {
            if (channel.type != ChannelType.GuildText && channel.type != ChannelType.GuildVoice) return;
            
            // buscar en el globaldata.info los permisos originales que fueron guardados en el lockdown
            let q = thisLock.originalPerms.find(x => x.channel === channel.id); // buscar los del canal actual

            if(!q) return; // si no encuentra, seguir (se eliminó el canal mientras estaba el lockdown)

            // traducir lo que está en la base de datos para poder cambiarlo
            let oldPermissionsQuery = q.perms;
            let oldPermissions = []
            oldPermissionsQuery.forEach(p => oldPermissions.push({ // para cada permiso que tiene el canal actual
                id: p.id,
                allow: p.allowed,
                deny: p.denied
            }))

            // actualizarlo con la informacion traducida a la original
            channel.permissionOverwrites.set(oldPermissions, `[BULK] Se terminó el lockdown (${interaction.user.tag})`);
        })

        let c = guild.channels.cache.get(thisLock.newChannel); // el canal que se creo despues de iniciar el lockdown
        interaction.editReply({ content: `${Loading} Eliminando el canal ${c}` })
        c.delete(`[BULK] Se terminó el lockdown (${interaction.user.tag})`)

        // eliminar el globaldata
        await locked.find(x => x.info === thisLock).remove();
        return interaction.editReply({ content: `${client.Emojis.Check} Listo` })
    }
}

module.exports = command