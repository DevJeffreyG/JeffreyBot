const { Command, Categories, Embed } = require("../../src/utils");
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

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { DarkShops, Users } = models;
    const { darkjeffros } = params;

    const { Emojis, EmojisObject } = client;
    
    const user = await Users.getOrCreate({user_id: interaction.user.id, guild_id: interaction.guild.id});
    const darkshop = await DarkShops.getOrCreate(interaction.guild.id);
    const toCalc = darkjeffros?.value ?? user.economy.dark.darkjeffros;

    // Comando
    const emote = darkshop.inflation.old <= darkshop.inflation.value ? "📈" : "📉";
    const inflation = darkshop.inflation.value;
    const embeds = [];

    let stonksEmbed = new Embed()
    .defAuthor({text: `Cálculo`, icon: EmojisObject.Dark.url})
    .defDesc(`${emote} **— ${darkshop.inflation.value}%**.
**— ${Emojis.DarkJeffros}${toCalc.toLocaleString('es-CO')} = ${Emojis.Jeffros}${Math.floor(toCalc*200*inflation).toLocaleString('es-CO')}**.`)
    .setColor(Colores.negro);

    embeds.push(stonksEmbed)

    const total = Math.floor(user.economy.global.jeffros / ( 200 * inflation ));

    let allConversion = new Embed()
    .defAuthor({text: "Puedes convertir...", title: true})
    .defDesc(`**${Emojis.Jeffros}${user.economy.global.jeffros.toLocaleString("es-CO")}** ➡️ **${Emojis.DarkJeffros}${total.toLocaleString("es-CO")}**`)
    .defColor(Colores.verdejeffrey)

    if(!darkjeffros && total != 0) embeds.push(allConversion)

    return interaction.editReply({embeds});
}

module.exports = command;