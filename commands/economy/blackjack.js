const { EconomyError } = require("../../src/errors");
const { Command, Categories, Blackjack, Embed, Cooldowns } = require("../../src/utils")

const command = new Command({
    name: "blackjack",
    desc: "Juega al Blackjack",
    category: Categories.Economy
})

command.addOption({
    type: "integer",
    name: "apuesta",
    desc: "¿Cuánto dinero te vas a jugar?",
    min: 1,
    req: true
})


command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { apuesta } = params;

    let user = params.getUser();

    if (user.economy.global.currency < apuesta.value) 
        throw new EconomyError(interaction, "No tienes tanto dinero para apostar", user.economy.global.currency)
    let winCounts = client.wonBlackjack.find(x => x.user === interaction.user.id && x.guild === interaction.guild.id)

    //console.log("Ha ganado %s en esta sesión", winCounts)

    let cool = await user.cooldown(Cooldowns.Blackjack, { info: true })

    console.log(cool)

    if (winCounts?.count === 5) {
        cool = await user.cooldown(Cooldowns.Blackjack, { instant: true })
        console.log(cool)
        if (cool) {
            winCounts.count = 0;
            return interaction.editReply({ embeds: [new Embed({ type: "cooldown", data: { cool } })] })
        }
    } else if (cool) return interaction.editReply({ embeds: [new Embed({ type: "cooldown", data: { cool } })] })

    const bj = new Blackjack(interaction, 4);
    await bj.start(apuesta.value, user, params.getDoc());
}

module.exports = command