const { Command, Categories, Embed, DaysUntilToday } = require("../../src/utils")
const { Config, Colores } = require("../../src/resources");
const { time } = require("discord.js")

const command = new Command({
    name: "darkstats",
    desc: "¡Revisa tus DarkJeffros, su duración, y tu precisión o el de otro usuario!",
    helpdesc: "Revisa tus DarkJeffros, su duración, y tu precisión o el de otro usuario",
    category: Categories.DarkShop
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario a revisar sus estadísticas"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users } = models
    const { usuario } = params;
    const { Emojis } = client;

    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);

    // codigo
    const member = usuario?.member ?? interaction.member;

    let user = await Users.getOrCreate({ user_id: member.id, guild_id: guild.id });

    const economy = user.economy.dark;

    const darkjeffros = economy?.darkjeffros.toLocaleString("es-CO") ?? "?";
    const accuracy = economy?.accuracy ?? "?";
    const total = economy?.duration ?? "?";

    const pastDays = await DaysUntilToday(economy?.dj_since);

    const dj_since = !economy?.dj_since ? null : time(economy.dj_since);

    let meEmbed = new Embed()
        .defAuthor({ text: `Estadísiticas del usuario N°${member.id}`, icon: member.displayAvatarURL({dynamic: true}) })
        .defDesc(`**— DarkJeffros**: **${Emojis.DarkJeffros}${darkjeffros}**.
**— Precisión**: ${accuracy}%
**— Duración de DarkJeffros**: \`${pastDays}\` de \`${total}\` días.
**— Desde**: ${dj_since ?? "?"}. 
**— Items**: Usa \`/dsinventory\`.`)
        .defThumbnail(Config.darkLogoPng)
        .defColor(Colores.negro);

    return interaction.editReply({ embeds: [meEmbed] });
}

module.exports = command;