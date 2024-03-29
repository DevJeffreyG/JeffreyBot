const { Command, Categories, Embed, ProgressBar } = require("../../src/utils")
const { Colores } = require("../../src/resources");
const { inlineCode } = require("discord.js")

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
    if (!interaction.deferred) await interaction.deferReply();

    const { Users } = models
    const { usuario } = params;
    const { DarkCurrency } = client.getCustomEmojis(interaction.guild.id);

    const guild = interaction.guild;

    // codigo
    const member = usuario?.member ?? interaction.member;

    let user = await Users.getOrCreate({ user_id: member.id, guild_id: guild.id });

    const economy = user.economy.dark;

    const currency = economy?.currency.toLocaleString("es-CO") ?? "?";
    const accuracy = economy?.accuracy ?? 0;

    let meEmbed = new Embed()
        .defAuthor({ text: `Estadísiticas del usuario N°${member.id}`, icon: client.EmojisObject.DarkShop.url })
        .defDesc(`**— ${DarkCurrency.name}**: **${DarkCurrency}${currency}**.
**— Precisión**: ${ProgressBar(accuracy, { max: 80 })} ${inlineCode(accuracy + "%")}
**— Items**: Usa ${client.mentionCommand("dsinventory")}.`)
        .defThumbnail(member.displayAvatarURL({ dynamic: true }))
        .defColor(Colores.negro);

    return interaction.editReply({ embeds: [meEmbed] });
}

module.exports = command;