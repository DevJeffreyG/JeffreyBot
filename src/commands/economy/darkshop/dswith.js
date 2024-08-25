const { EconomyError } = require("../../../errors");
const { Command, Embed, DarkShop, PrettyCurrency } = require("../../../utils")
const moment = require("moment-timezone");

const command = new Command({
    name: "dswith",
    desc: "Recupera tu inversión según la inflación actual"
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de dinero que vas a recuperar",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { cantidad } = params

    // codigo
    const quantity = cantidad.value;
    const user = params.getUser();

    const darkshop = new DarkShop(interaction.guild);

    const usermoney = user.getDarkCurrency();
    const total = Math.round(await darkshop.equals(null, quantity));

    const embeds = [];

    const success = new Embed({
        type: "success",
        data: {
            desc: [
                `Se han restado ${PrettyCurrency(interaction.guild, quantity, { name: "DarkCurrency" })}`,
                `Se añadieron ${PrettyCurrency(interaction.guild, total)} a tu cuenta`
            ]
        }
    })
    embeds.push(success);

    if (quantity > usermoney)
        throw new EconomyError(interaction, [
            "No tienes tanto dinero para cambiar",
            `Quieres cambiar: ${PrettyCurrency(interaction.guild, quantity, { name: "DarkCurrency" })}`
        ], usermoney, true)

    const economy = user.economy.dark;

    economy.currency -= quantity;

    // Si es domingo, significa que no se invirtió
    if (moment().day() === 0) {
        user.addCount("dark_currency", -quantity, false);
        user.addCurrency(total, true, false) += total; // No cambiar el contador alltime
    } else {
        await user.addCurrency(total);
    }

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Si recuperas algo de dinero durante la semana no los puedes re-invertir hasta el domingo`,
            likelihood: 20
        }
    })

    if (sug.likelihood) embeds.push(sug);

    return await interaction.editReply({ embeds });

}

module.exports = command;