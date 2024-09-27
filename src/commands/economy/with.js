const { EconomyError } = require("../../errors");
const { Command, PrettyCurrency, Confirmation, Embed } = require("../../utils");

const command = new Command({
    name: "with",
    desc: "Saca el dinero que has protegido"
});

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de dinero a sacar",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    const { Currency } = client.getCustomEmojis(interaction.guild.id);
    const { cantidad } = params;
    const doc = params.getDoc();
    const user = params.getUser();

    await interaction.deferReply();

    if (cantidad.value > user.getSecured())
        throw new EconomyError(
            interaction,
            `No tienes tantos ${Currency.name} protegidos.`,
            user.getSecured()
        )

    let transFee = Math.ceil(cantidad.value * doc.settings.quantities.percentages.interests.transaction_secured / 100);

    let conf = [
        `⚠️ Sacarás solo ${PrettyCurrency(interaction.guild, cantidad.value - transFee)}`,
        `⚠️ Pagarás el **${doc.settings.quantities.percentages.interests.transaction_secured}%** de la cantidad a sacar (${PrettyCurrency(interaction.guild, transFee)} no irán a tu cuenta).`,
        `Tienes ${PrettyCurrency(interaction.guild, user.getSecured())} protegidos.`
    ]

    let confirmation = await Confirmation("Sacar", conf, interaction);
    if (!confirmation) return;

    user.withdraw(cantidad.value, false);
    await user.removeCurrency(transFee, true);
    await doc.addToBank(transFee, "interests")

    return await interaction.editReply({ embeds: [new Embed({ type: "success" })] });
}

module.exports = command;