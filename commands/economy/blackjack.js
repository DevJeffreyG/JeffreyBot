const { Command, Categories, Blackjack, ErrorEmbed, Embed } = require("../../src/utils")

const command = new Command({
    name: "blackjack",
    desc: "Juega al Blackjack",
    category: Categories.Economy
})

command.addOption({
    type: "integer",
    name: "apuesta",
    desc: "Cuánto dinero te vas a jugar",
    min: 1,
    req: true
})


command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { Users } = models;
    const { apuesta } = params;

    let user = await Users.getOrCreate({
        user_id: interaction.user.id,
        guild_id: interaction.guild.id
    });

    let notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "blackjack",
            error: `No tienes tanto dinero para apostar.`,
            money: user.economy.global.currency
        }
    })

    if (user.economy.global.currency < apuesta.value) return notEnough.send();
    let winCounts = client.wonBlackjack.find(x => x.user === interaction.user.id && x.guild === interaction.guild.id)

    //console.log("Ha ganado %s en esta sesión", winCounts)

    let cool = user.cooldown("blackjack", { info: true })

    if (winCounts?.count === 5) {
        cool = user.cooldown("blackjack", { instant: true })
        if (cool) return interaction.editReply({ embeds: [new Embed({ type: "cooldown", data: { cool } })] })
        winCounts.count = 0;
    } else if (cool) return interaction.editReply({ embeds: [new Embed({ type: "cooldown", data: { cool } })] })

    const bj = new Blackjack(interaction, 4);
    bj.start(apuesta.value);

    //interaction.deleteReply();
}

module.exports = command