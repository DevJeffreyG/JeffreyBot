const { EconomyError } = require("../../../src/errors");
const { Command, ErrorEmbed, Embed, DarkShop, PrettyCurrency } = require("../../../src/utils")
const moment = require("moment-timezone");

const command = new Command({
    name: "dschange",
    desc: "Invierte tu dinero normal en la DarkShop"
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de dinero que quieres para la DarkShop",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    if (moment().day() != 0) {
        return interaction.reply({ ephemeral: true, embeds: [new ErrorEmbed().defDesc("**No** puedes invertir hasta que sea domingo.")] });
    }
    await interaction.deferReply();
    const { cantidad } = params
    const { DarkCurrency } = client.getCustomEmojis(interaction.guild.id);

    // codigo
    const quantity = cantidad.value;
    const user = params.getUser();

    let money = user.getCurrency();

    const darkshop = new DarkShop(interaction.guild);
    const one = await darkshop.oneEquals();

    const total = Math.round(one * quantity);

    const embeds = [];

    const success = new Embed({
        type: "success",
        data: {
            desc: [
                `Se han restado ${PrettyCurrency(interaction.guild, total)}`,
                `Se añadieron ${PrettyCurrency(interaction.guild, quantity, { name: "DarkCurrency" })} a tu cuenta`
            ]
        }
    })
    embeds.push(success);

    if (total > money) throw new EconomyError(interaction, [
        "No tienes tanto dinero para cambiar.",
        `Inflación: **${DarkCurrency}1** = ${PrettyCurrency(interaction.guild, one)}`,
        `Necesitas: ${PrettyCurrency(interaction.guild, total)}`
    ], money)

    const economy = user.economy.dark;

    await user.addDarkCurrency(quantity, false);
    user.getCurrency() -= total;

    economy.until = moment().add(1, "w").startOf("day").toDate();

    await user.save();

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Una vez a la semana puedes usar ${client.mentionCommand("predict")} para intentar adivinar si es buena idea vender tu inversión en ese momento`,
            likelihood: 20
        }
    })

    if (sug.likelihood) embeds.push(sug);

    return interaction.editReply({ embeds });

}

module.exports = command;