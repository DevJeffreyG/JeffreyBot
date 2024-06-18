const { Command, Embed, Cooldowns, BoostWork, PrettyCurrency, MinMaxInt } = require("../../utils");
const { Responses } = require("../../resources/");

const Chance = require("chance");

const command = new Command({
    name: "coins",
    desc: "Gana dinero extra cada cierto tiempo"
});

command.execute = async (interaction, models, params, client) => {
    const { Currency, DarkCurrency } = client.getCustomEmojis(interaction.guild.id);

    await interaction.deferReply();

    const guild = interaction.guild;
    const member = interaction.member;

    const user = params.getUser();
    const doc = params.getDoc();

    let cooldownInfo = await user.cooldown(Cooldowns.Coins, { check: false, info: true })

    let cool = await user.cooldown(Cooldowns.Coins, { save: false })
    if (cool) return interaction.editReply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    let maximum = doc.settings.quantities.limits.currency.coins.max;
    let min = doc.settings.quantities.limits.currency.coins.min;

    if (doc.toAdjust("coins")) {
        const average = doc.data.average_currency;

        if (average / maximum > doc.settings.quantities.adjust_ratio)
            maximum = Math.round(average / maximum / 2);

        console.log("⚪ Máximo: %s", maximum);
    }

    let fakeAdd = maximum * 50;

    // buscar si tiene boost
    const boost = BoostWork(user);

    let money = MinMaxInt(min, maximum * boost.probability.currency_value, { guild, msg: `No se ha podido determinar la recompensa de ${client.mentionCommand("coins")}` });
    let randommember;
    do {
        randommember = guild.members.cache.random()
    } while (randommember.user.id === member.id);

    randommember = `**${randommember.displayName}**`;

    let fakemoney = `${new Chance().integer({ min: fakeAdd, max: fakeAdd * 2 }).toLocaleString("es-CO")} ${Currency.name}`;

    money = Number((money * Number(boost.multiplier.currency_value)).toFixed(2));
    let tmoney = PrettyCurrency(guild, money, { boostemoji: boost.hasCurrencyChanges() ? boost.emojis.currency : null })

    let index = new Chance().pickone(Responses.coins);
    let textString = index.text;
    let text = textString.replace(
        new RegExp("{ MONEY }", "g"),
        `${tmoney}`
    ).replace(
        new RegExp("{ MEMBER }", "g"),
        `${randommember}`
    ).replace(
        new RegExp("{ FAKE MONEY }", "g"),
        `${fakemoney}`
    ).replace(
        new RegExp("{ COOLDOWN }", "g"),
        `${cooldownInfo / 60000}`
    ).replace(
        new RegExp("{ MONEY NAME }", "g"), Currency.name
    ).replace(
        new RegExp("{ DARK NAME }", "g"), DarkCurrency.name
    ).replace(
        new RegExp("{ OWNER }", "g"), interaction.guild.members.cache.get(interaction.guild.ownerId)
    )

    let embed = new Embed()
        .defColor(member.displayHexColor)
        .defDesc(`${text}.`);

    if (index.author) {
        let rAuthor = guild.members.cache.find(x => x.id === index.author);
        let suggestor = rAuthor ? rAuthor.displayName : "un usuario";
        let img = rAuthor ? rAuthor.displayAvatarURL() : guild.iconURL();
        embed.defFooter({ text: `• Respuesta sugerida por ${suggestor}`, icon: img })
    }

    await user.addCurrency(money);

    return await interaction.editReply({ embeds: [embed] });
}

module.exports = command;