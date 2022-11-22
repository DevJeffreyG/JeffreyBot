const { Command, Categories, Embed, DarkShop } = require("../../src/utils");
const { Config, Colores } = require("../../src/resources")

const command = new Command({
    name: "dscalc",
    desc: "Determina automáticamente cuantos Jeffros tienes actualmente",
    category: Categories.DarkShop
})

command.addOption({
    type: "integer",
    name: "darkjeffros",
    desc: "¿Cuánto valen X darkjeffros ahora mismo?",
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
    const { Users } = models;
    const { darkjeffros, inflacion } = params;

    const { Emojis, EmojisObject } = client;

    const user = await Users.getOrCreate({ user_id: interaction.user.id, guild_id: interaction.guild.id });
    const toCalc = darkjeffros?.value ?? user.economy.dark.darkjeffros;
    const darkshop = new DarkShop(interaction.guild);

    const inflation = inflacion?.value.toFixed(2) ?? await darkshop.getInflation();
    const one = await darkshop.oneEquals(inflation);
    const embeds = [];

    const calculation = await darkshop.equals(inflation, toCalc);

    let stonksEmbed = new Embed()
        .defAuthor({ text: `Cálculo`, icon: EmojisObject.Dark.url })
        .defDesc(`📊 **— ${inflation}%**.
**— ${Emojis.DarkJeffros}${toCalc.toLocaleString('es-CO')} = ${Emojis.Jeffros}${calculation.toLocaleString('es-CO')}**.`)
        .setColor(Colores.negro);

    embeds.push(stonksEmbed)

    const total = Math.floor(user.economy.global.jeffros / one);

    let allConversion = new Embed()
        .defAuthor({ text: "Puedes convertir...", title: true })
        .defDesc(`**${Emojis.Jeffros}${user.economy.global.jeffros.toLocaleString("es-CO")}** ➡️ **${Emojis.DarkJeffros}${total.toLocaleString("es-CO")}**`)
        .defColor(Colores.verdejeffrey)

    if (!darkjeffros && total != 0 && !inflacion) embeds.push(allConversion)

    return interaction.editReply({ embeds });
}

module.exports = command;