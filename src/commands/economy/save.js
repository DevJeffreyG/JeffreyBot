const moment = require("moment-timezone");
const { time } = require("discord.js");
const { EconomyError } = require("../../errors");
const { Command, Confirmation, PrettyCurrency, Embed } = require("../../utils");

const command = new Command({
    name: "save",
    desc: "Protege tu dinero de los robos"
});

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de dinero a proteger",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    const { Currency } = client.getCustomEmojis(interaction.guild.id);
    const { cantidad } = params;
    const doc = params.getDoc();
    const user = params.getUser();

    await interaction.deferReply();

    if (!user.affords(cantidad.value))
        throw new EconomyError(
            interaction,
            `No tienes tantos ${Currency.name}.`,
            user.getCurrency()
        )

    let transFee = Math.round(cantidad.value * doc.settings.quantities.percentages.interests.transaction_secured / 100);
    const realProtect = cantidad.value - transFee;
    const relativeDateFee = time(moment(doc.data.last_interests.secured).add(doc.settings.quantities.interest_days.secured, "days").toDate(), "R");

    let conf = [
        transFee > 0 ? `⚠️ Protegerás solo ${PrettyCurrency(interaction.guild, realProtect)}` : `Protegerás ${PrettyCurrency(interaction.guild, realProtect)}`,
        `⚠️ Estarás pagando el **${doc.settings.quantities.percentages.interests.transaction_secured}%** de la cantidad a guardar para poder proteger tu dinero (${PrettyCurrency(interaction.guild, transFee)} no se protegerán).`,
        `Se te cobrará el **${doc.settings.quantities.percentages.interests.secured}%** **${relativeDateFee}**`,
    ]

    if (user.getSecured() > 0)
        conf.push(`Tienes ${PrettyCurrency(interaction.guild, user.getSecured())} protegidos \`(\`${PrettyCurrency(interaction.guild, Math.round(user.getSecured() * doc.settings.quantities.percentages.interests.secured / 100))} ${relativeDateFee}\`)\`.`);

    let confirmation = await Confirmation("Proteger", conf, interaction);
    if (!confirmation) return;

    user.secure(realProtect, false);
    await user.removeCurrency(transFee, true)
    await doc.addToBank(transFee, "interests")

    return await interaction.editReply({ embeds: [new Embed({ type: "success" })] });
}

module.exports = command;