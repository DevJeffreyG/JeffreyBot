const { EconomyError, ModuleDisabledError } = require("../../src/errors");
const { Command, Confirmation, Embed, Cooldowns, HumanMs, PrettyCurrency } = require("../../src/utils");
const command = new Command({
    name: "exp",
    desc: "Transforma tu dinero en experiencia para tu perfil"
})

command.addOption({
    type: "integer",
    name: "dinero",
    desc: "El dinero que quieras cambiar a EXP",
    min: 1,
    max: 2000,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { dinero } = params;

    const doc = params.getDoc();
    const user = params.getUser();
    if (!doc.moduleIsActive("functions.currency_to_exp")) throw new ModuleDisabledError(interaction);

    if (!user.canBuy(dinero.value)) throw new EconomyError(interaction, "No tienes tanto dinero", user.getCurrency())

    let cool = await user.cooldown(Cooldowns.CurrencyToExp, { save: false });
    if (cool) return interaction.editReply({ embeds: [new Embed({ type: "cooldown", data: { cool } })] });

    let confirmation = await Confirmation("Cambiar dinero", [
        `¿Cambiar ${PrettyCurrency(interaction.guild, dinero.value)} a EXP?`,
        "Esta acción NO se puede deshacer.",
        `Sólo puedes usar este comando cada ${new HumanMs(await user.cooldown(Cooldowns.CurrencyToExp, { info: true, check: false })).human}.`
    ], interaction)
    if (!confirmation) return;

    user.economy.global.currency -= dinero.value;
    user.economy.global.exp += dinero.value;

    await user.save();
    return interaction.editReply({ embeds: [new Embed({ type: "success" })] });
}

module.exports = command;