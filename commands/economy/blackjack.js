const { EconomyError } = require("../../src/errors");
const { Command, Blackjack, Embed, Cooldowns } = require("../../src/utils")

const command = new Command({
    name: "blackjack",
    desc: "Juega al Blackjack"
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

    if (!user.affords(apuesta.value))
        throw new EconomyError(interaction, "No tienes tanto dinero para apostar", user.getCurrency());

    let winCounts = client.wonBlackjack.find(x => x.user === interaction.user.id && x.guild === interaction.guild.id)

    let cool = await user.cooldown(Cooldowns.Blackjack, { info: true })
    if (cool) {
        if (winCounts) winCounts.count = 0;
        return interaction.editReply({ embeds: [new Embed({ type: "cooldown", data: { cool } })] })
    }

    const bj = new Blackjack(interaction, 4);
    await bj.start(apuesta.value, user, params.getDoc());
}

module.exports = command