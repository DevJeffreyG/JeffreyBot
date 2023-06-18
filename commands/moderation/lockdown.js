const { ChannelType, PermissionsBitField, OverwriteType } = require("discord.js");
const { Command, Categories, Confirmation, Log, LogReasons, ChannelModules, ErrorEmbed } = require("../../src/utils");
const { DiscordLimitationError } = require("../../src/errors");

const command = new Command({
    name: "lockdown",
    desc: "Deshabilita temporalmente el canal donde se ejecuta el comando"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const discordError = new DiscordLimitationError(interaction, "editar canal", [
        "No pude editar el canal por un problema con Discord",
        "Verifica que Jeffrey Bot tenga acceso a este canal en los permisos"
    ])

    const doc = params.getDoc();

    const guild = interaction.guild;
    const Loading = client.Emojis.Loading;

    let locked = doc.data.locked_channels;

    if (locked.find(x => x.channel_id === interaction.channel.id)) return await unlock(); // togglear si ya está en lockdown

    let confirmation = await Confirmation("Lockdown", [
        `Se ocultará ${interaction.channel} para TODOS los roles del servidor, incluyendo el role @everyone.`,
        `Roles configurados de STAFF & Administradores **SÍ** podrán ver este canal.`,
        "Para volver a la normalidad hay que volver a usar este comando.",
        "Ten en cuenta que esto NO debe de hacerse más de dos veces en 10 minutos."
    ], interaction);
    if (!confirmation) return;

    try {
        await lock()
        return interaction.editReply({ content: `${client.Emojis.Check} Listo` })
    } catch (err) {
        console.log(err);
        throw discordError;
    }

    async function lock() {
        /* interaction.editReply({ content: `${Loading} Pausando invitaciones`, embeds: [] })
            try { await guild.edit({ features: interaction.guild.features.concat(GuildFeature.InvitesDisabled) }) } catch (err) { } */

        await interaction.editReply({ content: `${Loading} Obteniendo roles`, embeds: [] })

        // creacion de permisos denegados que va a tener cada role
        let revokedPermissions = [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.UseApplicationCommands,
            PermissionsBitField.Flags.ChangeNickname
        ]

        let grantedPermissions = [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
        ]

        let newChannelPerms = [];

        // la forma en que se denegan los permisos a todos los roles del servidor
        let staffRoles = doc.getStaffs();
        let adminRoles = doc.getAdmins();

        let roles = guild.roles.cache.filter(x => {
            if (!staffRoles.find(y => x.id === y) && !adminRoles.find(y => x.id === y)) return x;
        })

        let admitedRoles = guild.roles.cache.filter(x => {
            if (staffRoles.find(y => x.id === y) || adminRoles.find(y => x.id === y)) return x;
        })

        roles.forEach(role => {
            newChannelPerms.push({
                id: role.id,
                deny: revokedPermissions,
                allow: [],
                type: OverwriteType.Role
            })
        })

        admitedRoles.forEach(role => {
            newChannelPerms.push({
                id: role.id,
                deny: [],
                allow: grantedPermissions,
                type: OverwriteType.Role
            })
        })

        await interaction.editReply({ content: `${Loading} Guardando los permisos actuales de todos los roles` })

        const channel = interaction.channel;

        if (channel.type != ChannelType.GuildText && channel.type != ChannelType.GuildVoice) return;

        let oldPerms = [];

        // tomar cada permiso actual en cada uno de los canales del servidor y guardar la informacion
        channel.permissionOverwrites.cache.forEach(perm => {
            oldPerms.push({ id: perm.id, denied: perm.deny.toArray(), allowed: perm.allow.toArray(), type: perm.type });
        })
        let newLock = { channel_id: channel.id, perms: oldPerms };

        // denegar todos los permisos a cada role en el canal actual
        await interaction.editReply({ content: `${Loading} Editando el canal actual` })
        await channel.edit({ permissionOverwrites: newChannelPerms, reason: `[BULK] Lockdown por ${interaction.user.username}` })

        doc.data.locked_channels.push(newLock);
        doc.save();

        await new Log(interaction)
            .setReason(LogReasons.Settings)
            .setTarget(ChannelModules.ModerationLogs)
            .send({ content: `- **${interaction.user.username}** inició lockdown en ${interaction.channel}.` });
    }

    async function unlock() {
        console.log("🟢 Unlocking!")

        /* interaction.editReply({ content: `${Loading} Habilitando invitaciones` })
        try { await guild.edit({ features: interaction.guild.features.filter(x => x != GuildFeature.InvitesDisabled) }); } catch (err) { } */

        interaction.editReply({ content: `${Loading} Regresando los permisos al canal` })

        const channel = interaction.channel;

        if (channel.type != ChannelType.GuildText && channel.type != ChannelType.GuildVoice) return;

        // buscar los permisos originales que fueron guardados en el lockdown
        let q = locked.find(x => x.channel_id === channel.id); // buscar los del canal actual

        if (!q) return await new Log(interaction)
            .setReason(LogReasons.Error)
            .setTarget(ChannelModules.StaffLogs)
            .send({
                embeds: [
                    new ErrorEmbed()
                        .defDesc(`**No se encontró información de lockdown para este canal en la base de datos**`)
                ]
            });

        // traducir lo que está en la base de datos para poder cambiarlo
        let oldPermissionsQuery = q.perms;
        let oldPermissions = []
        oldPermissionsQuery.forEach(p => oldPermissions.push({ // para cada permiso que tiene el canal actual
            id: p.id,
            allow: p.allowed,
            deny: p.denied,
            type: p.type
        }))

        // actualizarlo con la informacion traducida a la original
        await channel.edit({ permissionOverwrites: oldPermissions, reason: `[BULK] Se terminó el lockdown (${interaction.user.username})` })
            .catch(err => {
                console.log(err)
                throw discordError;
            })

        // eliminar el original perms
        let lockedIndex = locked.findIndex(x => x.channel_id === channel.id);

        doc.data.locked_channels.splice(lockedIndex);
        doc.save();

        await new Log(interaction)
            .setReason(LogReasons.Settings)
            .setTarget(ChannelModules.ModerationLogs)
            .send({ content: `- **${interaction.user.username}** detuvo el lockdown en ${interaction.channel}.` });

        return interaction.editReply({ content: `${client.Emojis.Check} Listo` })
    }
}

module.exports = command