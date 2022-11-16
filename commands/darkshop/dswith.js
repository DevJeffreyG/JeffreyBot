const { Command, Categories, ErrorEmbed, Embed, DarkShop } = require("../../src/utils")
const Chance = require("chance");

const command = new Command({
    name: "dswith",
    desc: "Cambia DarkJeffros a Jeffros",
    category: Categories.DarkShop
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de DarkJeffros que vas a convertir",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users } = models;
    const { cantidad } = params
    const { Emojis } = client;

    // codigo
    const quantity = cantidad.value;
    const user = await Users.getOrCreate({ user_id: interaction.user.id, guild_id: interaction.guild.id });

    const darkshop = new DarkShop(interaction.guild);
    const inflation = await darkshop.getInflation();

    const darkjeffroValue = 200 * inflation;

    const darkjeffros = user.economy.dark.darkjeffros;
    const totalJeffros = Math.floor(darkjeffroValue * quantity);

    const notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "change",
            error: `No tienes tantos DarkJeffros para cambiar.
**▸** Quieres cambiar: **${Emojis.DarkJeffros}${quantity.toLocaleString("es-CO")}*`,
            money: darkjeffros,
            darkshop: true
        }
    })

    const embeds = [];

    const success = new Embed({
        type: "success",
        data: {
            desc: [
                `Se han restado **${Emojis.DarkJeffros}${quantity.toLocaleString('es-CO')}**`,
                `Se añadieron **${Emojis.Jeffros}${totalJeffros.toLocaleString("es-CO")}** a tu cuenta`
            ]
        }
    })
    embeds.push(success);

    if (quantity > darkjeffros) return notEnough.send();

    const economy = user.economy.dark;

    economy.darkjeffros -= quantity;
    user.economy.global.jeffros += totalJeffros;

    await user.save();

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Si cambias DarkJeffros en la semana no los puedes recuperar`,
            likelihood: 20
        }
    })

    if (sug.likelihood) embeds.push(sug);

    return interaction.editReply({ embeds });

}

module.exports = command;