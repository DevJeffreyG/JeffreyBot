const { time, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const { Command, Categories, Embed, Enum, BoostObjetives } = require("../../src/utils")

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

    const row = new ActionRowBuilder()
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

    let boosts = user.getBoosts();

    if (boosts?.length > 0) {
        for (const boost of boosts) {
            const { type, objetive, value, disabled } = boost.special;

            let boostobj = new Enum(BoostObjetives).translate(objetive);
            if (boostobj === "All") boostobj = "Todo"
            if (boostobj === "Currency") boostobj = client.getCustomEmojis(guild.id).Currency.name;

            embed
                .defField(`— 🚀 Boost de ${boostobj} x${value.toLocaleString("es-CO")}`,
                    `▸ Hasta: ${time(boost.active_until)} (${time(boost.active_until, "R")})${disabled ? `\n▸ **Desactivado**.` : ""}`, true);
        }
    }

    let achievements = user.getAchievements();
    let trophies = user.getTrophies();

    for (const trophy of trophies) {
        const info = custom.getTrophy(trophy.achievement);

        embed.defField(`🏆 — "${info.name}"`, `▸ ${info.desc}\n||▸ Desbloqueado: ${time(trophy.date)}||`, true)
    }

    let components = [];
    if (selectedUser && user.data.birthday.locked) components.push(row)

    let embeds = [];
    embeds.push(embed);

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Si ves las estadísticas de otro usuario y tiene establecido su cumpleaños puedo recordartelo`,
            likelihood: 1
        }
    })

    if (sug.likelihood && !selectedUser) embeds.push(sug);

    return interaction.editReply({ embeds, components });
}

module.exports = command;