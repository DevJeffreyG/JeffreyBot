const { time, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentAssertions } = require("discord.js");
const moment = require("moment");

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
    await interaction.deferReply();
    const { Users } = models
    const { usuario } = params;

    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);

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
            const { type, objetive, value } = boost.special;

            let boostobj = new Enum(BoostObjetives).translate(objetive);
            if (boostobj === "All") boostobj = "Todo"

            meEmbed
                .defField(`— 🚀 Boost de ${boostobj} x${value}`,
                    `▸ Hasta: ${time(moment(boost.active_since).add(boost.duration, "ms").toDate())}`, true);
        }
    }

    let components = [];
    if (selectedUser && user.data.birthday.locked) components.push(row)

    let embeds = [];
    embeds.push(embed);

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Si ves las estadísitcas de otro usuario y tiene establecido su cumpleaños puedo recordartelo`,
            likelihood: 5
        }
    })

    if (sug.likelihood && !selectedUser) embeds.push(sug);

    return interaction.editReply({ embeds, components });
}

module.exports = command;