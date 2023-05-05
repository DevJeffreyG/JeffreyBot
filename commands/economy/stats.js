const { time, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const { Command, Categories, Embed, Enum, BoostObjetives, Collector } = require("../../src/utils");
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "stats",
    desc: "Revisa tus estadísticas del servidor",
    category: Categories.Economy
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario al que vas a revisar sus estadísticas"
})

command.execute = async (interaction, models, params, client) => {
    if (!interaction.deferred) await interaction.deferReply();
    const { Users, CustomElements } = models
    const { usuario } = params;

    const guild = interaction.guild;
    const custom = await CustomElements.getOrCreate(guild.id);

    // codigo
    const selectedUser = usuario?.member && usuario?.member.id != interaction.member.id;
    const member = usuario?.member ?? interaction.member;

    let user = await Users.getOrCreate({ user_id: member.id, guild_id: guild.id });

    const row = new ActionRowBuilder();
    const bdrow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel("Recuérdame este cumpleaños")
                .setEmoji("🍰")
                .setStyle(ButtonStyle.Success)
                .setCustomId("rememberBirthday")
        )

    let embed = new Embed({
        type: "statistics", data: {
            member,
            user_doc: user
        }
    })

    let boostEmbed = new Embed(embed)
        .defColor(Colores.verdeclaro)
        .defAuthor({ text: `Boosts de ${member.user.tag}`, icon: member.guild.iconURL({ dynamic: true }) })
        .defDesc(null)

    let trophiesEmbed = new Embed(embed)
        .defAuthor({ text: `Trofeos de ${member.user.tag}`, icon: member.guild.iconURL({ dynamic: true }) })
        .defColor(Colores.verde)
        .defDesc(null)

    let embeds = {
        "stats": embed,
        "boosts": boostEmbed,
        "trophies": trophiesEmbed
    }

    let boosts = user.getBoosts();
    let trophies = user.getTrophies();

    if (boosts?.length > 0 || trophies?.length > 0) row.addComponents(
        new ButtonBuilder()
            .setLabel("Estadísticas")
            .setEmoji("📊")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("stats")
    );

    if (boosts?.length > 0) {

        row.addComponents(
            new ButtonBuilder()
                .setLabel("Boosts")
                .setEmoji("🚀")
                .setStyle(ButtonStyle.Success)
                .setCustomId("boosts")
        )

        for (const boost of boosts) {
            const { type, objetive, value, disabled } = boost.special;

            let boostobj = new Enum(BoostObjetives).translate(objetive);
            if (boostobj === "All") boostobj = "Todo"
            if (boostobj === "Currency") boostobj = client.getCustomEmojis(guild.id).Currency.name;

            boostEmbed
                .defField(`🚀 — Boost de ${boostobj} x${value.toLocaleString("es-CO")}`,
                    `▸ Hasta: ${time(boost.active_until)} (${time(boost.active_until, "R")})${disabled ? `\n▸ **Desactivado**.` : ""}`, true);
        }
    }

    if (trophies?.length > 0) {
        row.addComponents(
            new ButtonBuilder()
                .setLabel("Trofeos")
                .setEmoji("🏆")
                .setStyle(ButtonStyle.Success)
                .setCustomId("trophies")
        )

        for (const trophy of trophies) {
            const info = custom.getTrophy(trophy.element_id);

            trophiesEmbed.defField(`🏆 — "${info.name}"`, `▸ ${info.desc}\n▸ Desbloqueado: ${time(trophy.date)}`, true)
        }
    }

    let components = [];
    if (row.components.length > 0) components.push(row)
    if (selectedUser && user.data.birthday.locked) components.push(bdrow)

    let firstEmbeds = [];
    firstEmbeds.push(embed);

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Si ves las estadísticas de otro usuario y tiene establecido su cumpleaños puedo recordartelo`,
            likelihood: 1
        }
    })

    if (sug.likelihood && !selectedUser) firstEmbeds.push(sug);

    if (components.length === 0) return interaction.editReply({ embeds: firstEmbeds });

    let msg = await interaction.editReply({ embeds: firstEmbeds, components });

    const filter = async i => {
        return i.user.id === interaction.user.id && i.message.id === msg.id;
    }

    const collector = new Collector(interaction, { filter }).onEnd(() => {
        row.components.forEach(c => c.setDisabled());
        interaction.editReply({ components: [row] });
    }).raw();

    collector.on("collect", async i => {
        const selectedEmbed = i.customId;

        try {
            await interaction.editReply({ embeds: [embeds[selectedEmbed]], components });
        } catch (err) {
            console.log(err);
        }

    });
}

module.exports = command;