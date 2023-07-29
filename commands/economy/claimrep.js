const { ModuleDisabledError } = require("../../src/errors");
const { Command, Confirmation, Embed, ErrorEmbed, HumanMs, Cooldowns, BoostWork, PrettyCurrency } = require("../../src/utils")

const command = new Command({
    name: "claimrep",
    desc: "Toma los puntos de reputación que tengas y conviértelos en dinero"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const doc = params.getDoc();
    const user = params.getUser();

    if (!doc.moduleIsActive("functions.rep_to_currency")) throw new ModuleDisabledError(interaction);

    if (user.economy.global.reputation === 0) return interaction.editReply({ embeds: [new ErrorEmbed().defDesc(`**No tienes puntos de reputación...**`)] });

    let cool = await user.cooldown(Cooldowns.ClaimRep, { save: false });
    if (cool) return interaction.editReply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    let perRep = doc.settings.quantities.currency_per_rep;
    if (doc.toAdjust("claim_rep")) {
        if (doc.data.average_currency / perRep > 1000)
            perRep += Math.round(doc.data.average_currency * 0.01);
    }

    const boost = BoostWork(user);
    let value = user.economy.global.reputation * perRep * boost.multiplier.currency_value;

    let toConfirm = [
        `Se añadirán ${PrettyCurrency(interaction.guild, value, { boostemoji: boost.multiplier.changed.currency ? boost.emojis.currency : null })} a tu cuenta.`,
        `Sólo puedes usar este comando cada ${new HumanMs(await user.cooldown(Cooldowns.ClaimRep, { info: true, check: false })).human}.`
    ]

    let confirmation = await Confirmation("Reclamar reputación", toConfirm, interaction);
    if (!confirmation) return;

    await user.addCurrency(value)

    return confirmation.editReply({ embeds: [new Embed({ type: "success" })] })
}

module.exports = command