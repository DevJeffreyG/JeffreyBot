const { ActionRowBuilder, ButtonBuilder, time, ButtonStyle, PermissionFlagsBits } = require("discord.js")

const { Command, Embed, Collector } = require("../../utils")
const { Colores } = require("../../resources")

const command = new Command({
    name: "userinfo",
    desc: "Obtén información de un usuario"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario a consultar",
    req: false
});

command.execute = async (interaction, models, params, client) => {
    if (!interaction.deferred) await interaction.deferReply();

    const { Users, CustomElements } = models;
    const { usuario } = params;

    const member = usuario?.member ?? interaction.member;

    const doc = params.getDoc();
    const userd = await Users.getWork({ user_id: member.id, guild_id: interaction.guild.id })
    const custom = await CustomElements.getWork(interaction.guild.id);

    const reglas = doc.data.rules;
    const warnsd = userd.warns;
    const softwarnsd = userd.softwarns;
    const trophies = userd.getTrophies();

    const badges = member.user.flags.toArray()
    let bdgText = "";

    for (const badge of badges) {
        let e = client.Emojis[badge];
        if (!e) continue;

        bdgText += e.toString() + ", ";
    }

    bdgText = bdgText.slice(0, -2); // eliminar coma y espacio final

    const user = new Embed()
        .defAuthor({ text: member.user.username, icon: member.displayAvatarURL() })
        .defDesc(`**— General**
**Badges**: ${bdgText.length > 0 ? bdgText : "---"}.
**Bot**: ${member.user.bot ? "Sí" : "No"}.
**ID**: \`${member.id}\`.

**— Discord**
**Creación en**: ${time(member.user.createdAt)}.
**Tag**: ${member.user.username}`)
        .defThumbnail(member.displayAvatarURL())
        .defColor(Colores.verde)

    const server = new Embed()
        .defAuthor({ text: `Info de ${member.user.username} en el servidor`, icon: member.displayAvatarURL() })
        .defDesc(`**— Status**
**Owner**: ${interaction.guild.ownerId === member.id ? "Sí" : "No"}.
**Admin**: ${member.permissions.has(PermissionFlagsBits.Administrator) ? "Sí" : "No"}.
**Moderador**: ${member.permissions.has(PermissionFlagsBits.ManageMessages) ? "Sí" : "No"}.
**Timeout**: ${member.isCommunicationDisabled() ? `Sí, hasta ${time(member.communicationDisabledUntil)}` : "No"}.
**Booster desde**: ${member.premiumSince ? time(member.premiumSince) : "---"}.

**— Servidor**
**Se unió en**: ${time(member.joinedAt)}.
**Aceptó las reglas**: ${member.pending ? "Aún no" : "Sí"}.

**— Roles**
${member.roles.cache.toJSON().sort().join(", ")}`)
        .defThumbnail(member.displayAvatarURL())
        .defColor(Colores.verde)

    const warns = new Embed()
        .defAuthor({ text: `Warns de ${member.user.username}`, icon: member.displayAvatarURL() })
        .defColor(Colores.verde)

    const softwarns = new Embed()
        .defAuthor({ text: `Softwarns de ${member.user.username}`, icon: member.displayAvatarURL() })

        .defColor(Colores.verde)

    const trophiesEmbed = new Embed()
        .defAuthor({ text: `Trofeos de ${member.user.username}`, icon: member.displayAvatarURL() })
        .defColor(Colores.verde);

    for (const trophy of trophies) {
        const info = custom.getTrophy(trophy.element_id);

        trophiesEmbed.defField(`🏆 — "${info.name}"`, `▸ ${info.desc}\n▸ Desbloqueado: ${time(trophy.date)}\n▸ ID: \`${info.id}\``, true)
    }

    // foreach
    let [hasW, hasSW] = [false, false];
    warnsd.forEach(warn => {
        // sacar la regla
        let regla = reglas.find(x => x.id === warn.rule_id)?.name ?? "Warn por un Item";

        if (warn.rule_id != 0) warns.defField(`— ${regla} : Regla N°${warn.rule_id}`, `**— [Pruebas](${warn.proof})\n— ID: ${warn.id}**`)
        else warns.defField(`— ${regla}`, `**— ID: ${warn.id}**`)

        hasW = true;
    });

    softwarnsd.forEach(softwarn => {
        // sacar la regla
        let regla = reglas.find(x => x.id === softwarn.rule_id).name;
        softwarns.defField(`— ${regla} : Regla N°${softwarn.rule_id}`, `**— [Pruebas](${softwarn.proof})\n— ID: ${softwarn.id}**`)
        hasSW = true;
    });


    if (!hasW) warns.defDesc(`**— Bastante silencio por aquí...**`)
    if (!hasSW) softwarns.defDesc(`**— Bastante silencio por aquí...**`)

    const embeds = [user, server, warns, softwarns, trophiesEmbed];

    // interactive
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("0")
                .setLabel("Usuario")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("1")
                .setLabel("Servidor")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("2")
                .setLabel("Warns")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("3")
                .setLabel("Softwarns")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("4")
                .setLabel("Trofeos")
                .setStyle(ButtonStyle.Primary)
        )

    let msg = await interaction.editReply({ components: [row], embeds: [user] });

    const filter = async i => {
        return i.user.id === interaction.user.id && i.message.id === msg.id;
    }

    const collector = new Collector(interaction, { filter }).onEnd(() => {
        row.components.forEach(c => c.setDisabled());
        interaction.editReply({ components: [row] });
    }).raw();

    collector.on("collect", async i => {
        const pagn = Number(i.customId);

        try {
            await interaction.editReply({ embeds: [embeds[pagn]], components: [row] });
        } catch (err) {
            console.error("🔴 %s", err);
        }

    });
}

module.exports = command;