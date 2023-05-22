const moment = require("moment-timezone");
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
                .setCustomId(`rememberBirthday-${member.id}`)
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

        let boostInfo = {
            currency: 1,
            exp: 1
        }

        row.addComponents(
            new ButtonBuilder()
                .setLabel("Boosts")
                .setEmoji("🚀")
                .setStyle(ButtonStyle.Success)
                .setCustomId("boosts")
        )

        boosts.sort((a, b) => {
            if (moment(a.active_until).isAfter(b.active_until)) return -1;
            else if (moment(a.active_until).isBefore(b.active_until)) return 1;
            return 0;
        })

        for (const boost of boosts) {
            const { type, objetive, value, disabled } = boost.special;

            let boostobj = new Enum(BoostObjetives).translate(objetive);
            if (boostobj === "All") boostobj = "Todo"
            if (boostobj === "Currency") boostobj = client.getCustomEmojis(guild.id).Currency.name;

            switch (objetive) {
                case BoostObjetives.Currency:
                    boostInfo.currency *= value;
                    break;
                case BoostObjetives.EXP:
                    boostInfo.exp *= value;
                    break;

                case BoostObjetives.All:
                    boostInfo.currency *= value;
                    boostInfo.exp *= value;
                    break;
            }

            if (!boostEmbed.data.fields || boostEmbed.data.fields.length <= 20) {
                boostEmbed
                    .defField(`🚀 — Boost de ${boostobj} x${value.toLocaleString("es-CO")}`,
                        `▸ Hasta: ${time(boost.active_until)} (${time(boost.active_until, "R")})${disabled ? `\n▸ **Desactivado**.` : ""}`, true);
            } else {
                boostEmbed.defField("🚀 — ...", `Y unos ${boosts.length - 20} más.`)
                break;
            }
        }

        boostEmbed.defFooter({
            text: `📊 ${client.getCustomEmojis(guild.id).Currency.name} x${boostInfo.currency.toLocaleString("es-CO")}, EXP x${boostInfo.exp.toLocaleString("es-CO")}`
        })
    }

    if (trophies?.length > 0) {
        row.addComponents(
            new ButtonBuilder()
                .setLabel("Trofeos")
                .setEmoji("🏆")
                .setStyle(ButtonStyle.Success)
                .setCustomId("trophies")
        )

        trophies.sort((a, b) => {
            if (moment(a.date).isAfter(b.date)) return -1;
            else if (moment(a.date).isBefore(b.date)) return 1;
            return 0;
        })

        for (const trophy of trophies) {
            const info = custom.getTrophy(trophy.element_id);

            if (!trophiesEmbed.data.fields || trophiesEmbed.data.fields.length <= 20) {
                trophiesEmbed.defField(`🏆 — "${info.name}"`, `▸ ${info.desc}\n▸ Desbloqueado: ${time(trophy.date)}`, true)
            } else {
                trophiesEmbed.defField("🏆 — ...", `Y unos ${trophies.length - 20} más.`)
                break;
            }
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
        return i.user.id === interaction.user.id && i.message.id === msg.id && !i.customId.startsWith("rememberBirthday");
    }

    const collector = new Collector(interaction, { filter }).onEnd(() => {
        if (row.components.length > 0) {
            row.components.forEach(c => c.setDisabled());
            interaction.editReply({ components: [row] });
        }
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