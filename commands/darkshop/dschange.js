const { Command, Categories, ErrorEmbed, Embed, DarkShop } = require("../../src/utils")

const Chance = require("chance");
const moment = require("moment");

const command = new Command({
    name: "dschange",
    desc: "Invierte tu dinero normal en la DarkShop",
    category: Categories.DarkShop
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "La cantidad de dinero que quieres para la DarkShop",
    min: 1,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    if (moment().day() != 0) {
        return interaction.reply({ ephemeral: true, content: `${client.Emojis.Error} NO puedes invertir más hasta que sea domingo.` })
    }
    await interaction.deferReply();
    const { Users } = models;
    const { cantidad } = params
    const { DarkCurrency, Currency } = client.getCustomEmojis(interaction.guild.id);

    // codigo
    const quantity = cantidad.value;
    const user = await Users.getOrCreate({ user_id: interaction.user.id, guild_id: interaction.guild.id });

    let money = user.economy.global.currency;

    const darkshop = new DarkShop(interaction.guild);
    const one = await darkshop.oneEquals();

    const total = Math.round(one * quantity);

    const notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "change",
            error: `No tienes tanto dinero para cambiar.
**▸** Inflación: **${DarkCurrency}1** = **${Currency}${one.toLocaleString("es-CO")}**
**▸** Necesitas: **${Currency}${total.toLocaleString("es-CO")}**`,
            money
        }
    })

    const embeds = [];

    const success = new Embed({
        type: "success",
        data: {
            desc: [
                `Se han restado **${Currency}${total.toLocaleString('es-CO')}**`,
                `Se añadieron **${DarkCurrency}${quantity.toLocaleString("es-CO")}** a tu cuenta`
            ]
        }
    })
    embeds.push(success);

    if (total > money) return notEnough.send();

    const economy = user.economy.dark;

    economy.currency += quantity;
    user.economy.global.currency -= total;

    economy.accuracy = economy.accuracy ?? Number(10 + (Math.random() * 10).toFixed(1));
    economy.until = moment().add(1, "w").startOf("day").toDate();

    await user.save();

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Una vez a la semana puedes usar \`/predict\` para intentar adivinar si es buena idea vender tu inversión en ese momento`,
            likelihood: 20
        }
    })

    if (sug.likelihood) embeds.push(sug);

    return interaction.editReply({ embeds });

}

module.exports = command;