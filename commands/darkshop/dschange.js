const { Config } = require("../../src/resources");
const { Command, Categories, ErrorEmbed, Embed } = require("../../src/utils")
const { daysDarkJeffros } = Config;
const Chance = require("chance");

const command = new Command({
    name: "dschange",
    desc: "Cambia Jeffros a DarkJeffros",
    category: Categories.DarkShop
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de DarkJeffros que quieres",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users, DarkShops } = models;
    const { cantidad } = params
    const { Emojis } = client;

    // codigo
    const quantity = cantidad.value;
    const user = await Users.getOrCreate({user_id: interaction.user.id, guild_id: interaction.guild.id});

    let jeffros = user.economy.global.jeffros;

    const darkshop = await DarkShops.getOrCreate(interaction.guild.id);

    const inflation = darkshop.inflation.value;
    const darkjeffroValue = 200*inflation;

    const totalJeffros = Math.floor(darkjeffroValue * quantity);

    const notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "change",
            error: `No tienes tantos Jeffros para cambiar.
**▸** Inflación: **${Emojis.DarkJeffros}1** = **${Emojis.Jeffros}${darkjeffroValue.toLocaleString("es-CO")}**
**▸** Necesitas: **${Emojis.Jeffros}${totalJeffros.toLocaleString("es-CO")}**`,
            money: jeffros
        }
    })

    const embeds = [];

    const success = new Embed({
        type: "success",
        data: {
            desc: [
                `Se han restado **${Emojis.Jeffros}${totalJeffros.toLocaleString('es-CO')}**`,
                `Se añadieron **${Emojis.DarkJeffros}${quantity.toLocaleString("es-CO")}** a tu cuenta`
            ]
        }
    })
    .defFooter({text: `Para ver la duración de tus DarkJeffros usa '/darkstats'.`})
    embeds.push(success);

    if(totalJeffros > jeffros) return notEnough.send();

    const hoy = new Date();
    const duration = Math.ceil(darkshop.inflation.duration) + Math.floor(Math.random() * daysDarkJeffros)
    const economy = user.economy.dark;

    economy.darkjeffros += quantity;
    user.economy.global.jeffros -= totalJeffros;

    economy.accuracy = economy.accuracy ?? Number((Math.random() * 15).toFixed(1));
    economy.duration = economy.duration ?? Number(duration);
    economy.dj_since = economy.dj_since ?? hoy;

    await user.save();

    if(new Chance().bool({likelihood: 20})) {
        let sug = new Embed({
            type: "didYouKnow",
            data: `Puedes saber la cantidad exacta para cambiar todos tus Jeffros en el comando \`/dscalc\``
        })

        embeds.push(sug);
    }

    return interaction.editReply({embeds});

}

module.exports = command;