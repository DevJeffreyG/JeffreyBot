const { Command, Categories, Embed, BoostTypes, BoostObjetives, Cooldowns, GetRandomItem, FindAverage } = require("../../src/utils");

const { Responses } = require("../../src/resources/");

const command = new Command({
    name: "coins",
    desc: "Gana dinero extra cada cierto tiempo",
    category: Categories.Economy
});

command.execute = async (interaction, models, params, client) => {
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

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

    let maximum = 20;
    let fakeAdd = 999;

    if (doc.settings.functions["adjust_coins"]) {
        let average = await FindAverage(guild);
        fakeAdd = average * 0.5;
        if ((average - maximum) > 10000) maximum = average * 0.1;
    }

    let money = Math.ceil(Math.random() * maximum);
    let tmoney = `**${Currency}${money.toLocaleString('es-CO')}**`;
    let randommember = guild.members.cache.random();

    while (randommember.user.id === member.id) { // el randommember NO puede ser el mismo usuario
        console.log("'/coins', Es el mismo usuario, buscar otro random")
        randommember = guild.members.cache.random()
    }

    randommember = `**${randommember.displayName}**`;

    let fakemoney = `${Math.round(Math.ceil(Math.random() * 1000) + fakeAdd).toLocaleString("es-CO")} ${Currency.name}`;

    let prevMoney = money;
    
    // buscar si tiene boost
    for (let i = 0; i < user.data.temp_roles.length; i++) {
        const temprole = user.data.temp_roles[i];
        const specialInfo = temprole.special;

        if (specialInfo.type === BoostTypes.Multiplier) {
            if ((specialInfo.objetive === BoostObjetives.Currency || specialInfo.objetive === BoostObjetives.All) && !specialInfo.disabled) {
                money = Number((money * Number(specialInfo.value)).toFixed(2));
                tmoney = prevMoney < money ? `**${Currency}${money.toLocaleString('es-CO')}🚀**` : `**${Currency}${money.toLocaleString('es-CO')}😟**`;
            }
        }
    }

    let index = GetRandomItem(Responses.coins);
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
    ).replace(new RegExp("{ COOLDOWN }", "g"), `${cooldownInfo / 60000}`);

    let embed = new Embed()
        .defColor(member.displayHexColor)
        .defDesc(`${text}.`);

    if (index.author) {
        let rAuthor = guild.members.cache.find(x => x.id === index.author);
        let suggestor = rAuthor ? rAuthor.user.tag : "un usuario";
        let img = rAuthor ? rAuthor.displayAvatarURL() : guild.iconURL();
        embed.defFooter({ text: `• Respuesta sugerida por ${suggestor}`, icon: img })
    }

    await user.addCurrency(money);

    return interaction.editReply({ embeds: [embed] });
}

module.exports = command;