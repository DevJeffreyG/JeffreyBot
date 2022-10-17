const { Command, Categories, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "inflacion",
    desc: "Te muestra la inflación actual de los DarkJeffros",
    category: Categories.DarkShop
})

command.execute = async (interaction, models, params, client) => {
    const { DarkShops } = models;
    const { Emojis, EmojisObject } = client;
    
    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);

    // codigo
    const dark = await DarkShops.findOne({
        guild_id: guild.id
    });

    let stonks;
    if(dark.inflation.old <= dark.inflation.value){
        stonks = "📈";
    } else {
        stonks = "📉";
    }

    let stonksEmbed = new Embed()
    .defAuthor({text: `DarkShop: Inflación`, icon: EmojisObject.Dark.url})
    .defDesc(`${stonks} **—** La inflación actual de los DarkJeffros es de un **${dark.inflation.value}%**.
**— ${Emojis.DarkJeffros}1 = ${Emojis.Jeffros}${Math.floor(200*dark.inflation.value).toLocaleString('es-CO')}**.
**—** Antes era de un \`${dark.inflation.old}%\`.`)
    .defColor(Colores.negro);

    interaction.reply({embeds: [stonksEmbed]});
}

module.exports = command;