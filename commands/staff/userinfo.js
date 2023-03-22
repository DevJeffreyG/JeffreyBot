const { ActionRowBuilder, ButtonBuilder, time, ButtonStyle, PermissionFlagsBits } = require("discord.js")

const { Command, Categories, Embed, Collector } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const ms = require("ms");

const command = new Command({
    name: "userinfo",
    desc: "Obtén información de un usuario",
    category: Categories.Staff
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario a consultar",
    req: false
});

command.execute = async (interaction, models, params, client) => {
    if (!interaction.deferred) await interaction.deferReply();

    const { Guilds, Users } = models;
    const { usuario } = params;
    const member = usuario?.member ?? interaction.member;

    const badges = member.user.flags.toArray()
    let bdgText = "";

    for (const badge of badges) {
        let e = client.Emojis[badge];
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
**Tag**: ${member.user.tag}`)
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

    const doc = await Guilds.getOrCreate(interaction.guild.id)
    const reglas = doc.data.rules;

    const userd = await Users.getOrCreate({ user_id: member.id, guild_id: interaction.guild.id })

    const warnsd = userd.warns;
    const softwarnsd = userd.softwarns;

    const warns = new Embed()
        .defAuthor({ text: `Warns de ${member.user.username}`, icon: member.displayAvatarURL() })
        .defColor(Colores.verde)

    const softwarns = new Embed()
        .defAuthor({ text: `Softwarns de ${member.user.username}`, icon: member.displayAvatarURL() })

        .defColor(Colores.verde)

    // foreach
    let [hasW, hasSW] = [false, false];
    warnsd.forEach(warn => {
        // sacar la regla
        let regla = reglas.find(x => x.id === warn.rule_id)?.name ?? "Víctima de la DARKSHOP";

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

    const embeds = [user, server, warns, softwarns];

    // interactive
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("back")
                .setEmoji("⬅️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("next")
                .setEmoji("➡️")
                .setStyle(ButtonStyle.Primary),
        )

    let msg = await interaction.editReply({ components: [row], embeds: [user] });

    const filter = async i => {
        return i.user.id === interaction.user.id &&
            (i.customId === "back" || i.customId === "next") &&
            i.message.id === msg.id;
    }

    const collector = new Collector(interaction, { filter }).onEnd(() => {
        row.components.forEach(c => c.setDisabled());
        interaction.editReply({ components: [row] });
    }).raw();

    let pagn = 0;
    collector.on("collect", async i => {
        if (i.customId === "back") pagn--;
        else pagn++;

        if (pagn === 0) row.components[0].setDisabled();
        else row.components[0].setDisabled(false);

        if (pagn === embeds.length - 1) row.components[1].setDisabled();
        else row.components[1].setDisabled(false);

        try {
            await interaction.editReply({ embeds: [embeds[pagn]], components: [row] });
        } catch (err) {
            console.log(err);
        }

    });
}

module.exports = command;