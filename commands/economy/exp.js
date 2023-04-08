const { Command, Categories, Confirmation, ErrorEmbed, Embed, Cooldowns, HumanMs } = require("../../src/utils");
const command = new Command({
    name: "exp",
    desc: "Transforma tu dinero en experiencia para tu perfil",
    category: Categories.Economy
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
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const guild = params.getDoc();
    const user = params.getUser();
    if (!guild.moduleIsActive("functions.currency_to_exp")) return new ErrorEmbed(interaction, { type: "moduleDisabled" }).send();


    if (!user.canBuy(dinero.value)) return new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "currency to exp",
            error: "No tienes tanto dinero.",
            money: user.economy.global.currency,
            darkshop: false
        }
    }).send()

    let cool = await user.cooldown(Cooldowns.CurrencyToExp, { save: false });
    if (cool) return interaction.editReply({ embeds: [new Embed({ type: "cooldown", data: { cool } })] });

    let confirmation = await Confirmation("Cambiar dinero", [
        `¿Cambiar **${Currency}${dinero.value.toLocaleString("es-CO")}** a EXP?`,
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