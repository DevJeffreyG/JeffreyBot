const { Command, Categories, Embed, DarkShop } = require("../../src/utils");
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "dscalc",
    desc: "Determina automáticamente cuánto dinero tienes invertido actualmente",
    category: Categories.DarkShop
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
    const { DarkCurrency, Currency } = client.getCustomEmojis(interaction.guild.id);

    const user = params.getUser();
    const toCalc = darkcurrency?.value ?? user.economy.dark.currency;
    const darkshop = new DarkShop(interaction.guild);

    const inflation = inflacion?.value.toFixed(2) ?? await darkshop.getInflation();
    const one = await darkshop.oneEquals(inflation);
    const embeds = [];

    const calculation = await darkshop.equals(inflation, toCalc);

    let stonksEmbed = new Embed()
        .defAuthor({ text: `Cálculo`, icon: EmojisObject.DarkShop.url })
        .defDesc(`📊 **— ${inflation}%**.
**— ${DarkCurrency}${toCalc.toLocaleString('es-CO')} = ${Currency}${calculation.toLocaleString('es-CO')}**.`)
        .setColor(Colores.negro);

    embeds.push(stonksEmbed)

    const total = Math.floor(user.economy.global.currency / one);

    let allConversion = new Embed()
        .defAuthor({ text: "Puedes convertir...", title: true })
        .defDesc(`**${Currency}${user.economy.global.currency.toLocaleString("es-CO")}** ➡️ **${DarkCurrency}${total.toLocaleString("es-CO")}**`)
        .defColor(Colores.verdejeffrey)

    if (!darkcurrency && total > 0 && !inflacion) embeds.push(allConversion)

    return interaction.editReply({ embeds });
}

module.exports = command;