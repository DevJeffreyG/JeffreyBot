const { EconomyError } = require("../../../src/errors");
const { Command, Embed, DarkShop } = require("../../../src/utils")
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
    const { DarkCurrency, Currency } = client.getCustomEmojis(interaction.guild.id);

    // codigo
    const quantity = cantidad.value;
    const user = params.getUser();

    const darkshop = new DarkShop(interaction.guild);

    const usermoney = user.economy.dark.currency;
    const total = Math.round(await darkshop.equals(null, quantity));

    const embeds = [];

    const success = new Embed({
        type: "success",
        data: {
            desc: [
                `Se han restado **${DarkCurrency}${quantity.toLocaleString('es-CO')}**`,
                `Se añadieron **${Currency}${total.toLocaleString("es-CO")}** a tu cuenta`
            ]
        }
    })
    embeds.push(success);

    if (quantity > usermoney)
        throw new EconomyError(interaction, [
            "No tienes tanto dinero para cambiar",
            `Quieres cambiar: **${DarkCurrency}${quantity.toLocaleString("es-CO")}**`
        ], usermoney, true)

    const economy = user.economy.dark;

    economy.currency -= quantity;

    if(moment().day() === 0) {
        user.data.counts.dark_currency -= quantity;
    }

    await user.addCurrency(total);

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Si recuperas algo de dinero durante la semana no los puedes re-invertir hasta el domingo`,
            likelihood: 20
        }
    })

    if (sug.likelihood) embeds.push(sug);

    return interaction.editReply({ embeds });

}

module.exports = command;