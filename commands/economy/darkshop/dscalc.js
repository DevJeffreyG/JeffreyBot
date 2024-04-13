const { Command, Embed, DarkShop, PrettyCurrency } = require("../../../src/utils");
const { Colores } = require("../../../src/resources")
const moment = require("moment-timezone");

const command = new Command({
    name: "dscalc",
    desc: "Determina automáticamente cuánto dinero tienes invertido actualmente"
})

command.addOption({
    type: "integer",
    name: "darkcurrency",
    desc: "¿Cuánto vale X cantidad ahora mismo?",
    req: false,
    min: 1
})

command.addOption({
    type: "number",
    name: "inflacion",
    desc: "Con esta inflación ficticia",
    req: false,
    min: -200,
    max: 200
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { darkcurrency, inflacion } = params;

    const { EmojisObject } = client;

    const user = params.getUser();
    const toCalc = darkcurrency?.value ?? user.getDarkCurrency();
    const darkshop = new DarkShop(interaction.guild);

    const inflation = inflacion?.value.toFixed(2) ?? await darkshop.getInflation();
    const one = await darkshop.oneEquals(inflation);
    const embeds = [];

    const calculation = await darkshop.equals(inflation, toCalc);

    let stonksEmbed = new Embed()
        .defAuthor({ text: `Cálculo`, icon: EmojisObject.DarkShop.url })
        .defDesc(`📊 **— ${inflation}%**.
**—** ${PrettyCurrency(interaction.guild, toCalc, { name: "DarkCurrency" })} = ${PrettyCurrency(interaction.guild, calculation)}.`)
        .setColor(Colores.negro);

    embeds.push(stonksEmbed)

    const total = Math.floor(user.getCurrency() / one);

    let allConversion = new Embed()
        .defAuthor({ text: "Puedes convertir...", title: true })
        .defDesc(`${PrettyCurrency(interaction.guild, user.getCurrency())} ➡️ ${PrettyCurrency(interaction.guild, total, { name: "DarkCurrency" })}`)
        .defColor(Colores.verdejeffrey)

    if (!darkcurrency && total > 0 && !inflacion && moment().day() === 0) embeds.push(allConversion)

    return await interaction.editReply({ embeds });
}

module.exports = command;