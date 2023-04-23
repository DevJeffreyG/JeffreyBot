const { ModuleDisabledError } = require("../../src/errors");
const { Command, Categories, Confirmation, Embed, ErrorEmbed, HumanMs, Cooldowns } = require("../../src/utils")

const command = new Command({
    name: "claimrep",
    desc: "Toma los puntos de reputación que tengas y conviértelos en dinero",
    category: Categories.Economy
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const guild = params.getDoc();
    const user = params.getUser();

    if (!guild.moduleIsActive("functions.rep_to_currency")) throw new ModuleDisabledError(interaction);

    if (user.economy.global.reputation === 0) return interaction.editReply({ embeds: [new ErrorEmbed().defDesc(`**No tienes puntos de reputación...**`)] });

    let cool = await user.cooldown(Cooldowns.ClaimRep, { save: false });
    if (cool) return interaction.editReply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    let value = user.economy.global.reputation * guild.settings.quantities.currency_per_rep;

    let toConfirm = [
        `Se añadirán **${Currency}${value.toLocaleString("es-CO")}** a tu cuenta.`,
        `Sólo puedes usar este comando cada ${new HumanMs(await user.cooldown(Cooldowns.ClaimRep, { info: true, check: false })).human}.`
    ]

    let confirmation = await Confirmation("Reclamar reputación", toConfirm, interaction);
    if (!confirmation) return;

    await user.addCurrency(value)

    return confirmation.editReply({ embeds: [new Embed({ type: "success" })] })
}

module.exports = command