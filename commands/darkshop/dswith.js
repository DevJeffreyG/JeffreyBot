const { Emojis, Config } = require("../../src/resources");
const { Command, Categories, ErrorEmbed, Embed } = require("../../src/utils")
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
    const { Users, DarkShops } = models;
    const { cantidad } = params

    // codigo
    const quantity = cantidad.value;
    const user = await Users.getOrCreate({user_id: interaction.user.id, guild_id: interaction.guild.id});

    const darkshop = await DarkShops.getOrCreate(interaction.guild.id);

    const inflation = darkshop.inflation.value;
    const darkjeffroValue = 200*inflation;

    const darkjeffros = user.economy.dark.darkjeffros;
    const totalJeffros = Math.floor(darkjeffroValue * quantity);

    const notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "change",
            error: `No tienes tantos DarkJeffros para cambiar.
**▸** Quieres cambiar: **${Emojis.Dark}${quantity.toLocaleString("es-CO")}*`,
            money: darkjeffros,
            darkshop: true
        }
    })

    const embeds = [];

    const success = new Embed({
        type: "success",
        data: {
            desc: [
                `Se han restado **${Emojis.Dark}${quantity.toLocaleString('es-CO')}**`,
                `Se añadieron **${Emojis.Jeffros}${totalJeffros.toLocaleString("es-CO")}** a tu cuenta`
            ]
        }
    })
    embeds.push(success);

    if(quantity > darkjeffros) return notEnough.send();

    const economy = user.economy.dark;

    economy.darkjeffros -= quantity;
    user.economy.global.jeffros += totalJeffros;

    await user.save();

    if(new Chance().bool({likelihood: 20})) {
        let sug = new Embed({
            type: "didYouKnow",
            data: `Porque hayas cambiado todos tus DarkJeffros, aún debes estar al pendiente de la duración de estos`
        })

        embeds.push(sug);
    }

    return interaction.editReply({embeds});

}

module.exports = command;