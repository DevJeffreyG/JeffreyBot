const { Command, Categories, Embed, DaysUntilToday } = require("../../src/utils")
const { Config, Colores } = require("../../src/resources");
const { time } = require("discord.js")

const command = new Command({
    name: "darkstats",
    desc: "Revisa tus estadísticas en la DarkShop",
    category: Categories.DarkShop
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
    const { DarkCurrency } = client.getCustomEmojis(interaction.guild.id);

    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);

    // codigo
    const member = usuario?.member ?? interaction.member;

    let user = await Users.getOrCreate({ user_id: member.id, guild_id: guild.id });

    const economy = user.economy.dark;

    const currency = economy?.currency.toLocaleString("es-CO") ?? "?";
    const accuracy = economy?.accuracy ?? "?";

    let meEmbed = new Embed()
        .defAuthor({ text: `Estadísiticas del usuario N°${member.id}`, icon: client.EmojisObject.Dark.url })
        .defDesc(`**— ${DarkCurrency.name}**: **${DarkCurrency}${currency}**.
**— Precisión**: ${accuracy}%
**— Items**: Usa \`/dsinventory\`.`)
        .defThumbnail(member.displayAvatarURL({dynamic: true}))
        .defColor(Colores.negro);

    return interaction.editReply({ embeds: [meEmbed] });
}

module.exports = command;