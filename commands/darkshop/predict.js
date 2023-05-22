const { Command, Categories, Embed, DarkShop, GetRandomItem, Cooldowns, ErrorEmbed } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const Chance = require("chance")
const moment = require("moment-timezone")

const command = new Command({
    name: "predict",
    desc: "De acuerdo a tu precisión, predice si es buena idea recuperar tu inversión en este momento",
    category: Categories.DarkShop
})

command.addOption({
    type: "boolean",
    name: "compartir",
    desc: "¿Mostrar el resultado de tu predicción en el chat?"
})

command.execute = async (interaction, models, params, client) => {
    if (moment().day() === 0) {
        return interaction.reply({ ephemeral: true, embeds: [new ErrorEmbed().defDesc("No es buena idea hacer eso el domingo.")] })
    }

    const { compartir } = params;

    await interaction.deferReply({ ephemeral: !compartir?.value });

    const user = params.getUser();

    if (user.economy.dark.currency === 0) return interaction.editReply({ embeds: [new ErrorEmbed().defDesc(`No tienes nada invertido, mejor esperar al domingo y usar ${client.mentionCommand("dschange")}.`)] })

    const darkshop = new DarkShop(interaction.guild, interaction)
    const values = await darkshop.getAllValues();
    const now = await darkshop.getInflation();

    let all = [];

    for (const prop of Object.keys(values)) {
        for (const infl of values[prop]) {
            all.push(infl);
        }
    }

    let original = all.slice(0);

    all.sort((a, b) => b - a)

    // entre menor, mejor
    let worst = all[all.length - 1];
    let best = all[0];
    let r = new Chance().bool();

    let guessCorrectly = new Chance().bool({ likelihood: user.economy.dark?.accuracy });

    if (guessCorrectly) {
        let oIndex = (moment().day() * 2) - (moment().hours() >= 12 ? 1 : 2)
        let left = original.slice(oIndex);

        if (left.length === 1) r = true; // ya no hay nada que hacer
        else if (left.find(x => x > now)) r = false // si hay algo mejor, esperar
        else r = true; // ya no hay nada mejor, se debe vender
    }

    if (new Chance().bool({ likelihood: 0.001 })) {
        console.log("🟥 0.001% de invertir el resultado anterior")
        guessCorrectly = false
        r = r ? false : true;
    }

    console.log(`🟢 Se predijo que ${r ? "sí" : "no"} hay que venderlos con ${now}%. Garantizado es correcto: ${guessCorrectly}`)
    console.log("⚪ Lo mejor: %s\n⚪ Lo peor: %s", best, worst);

    let force_cooldown = moment().weekday(7).hour(0).minutes(0).seconds(0).millisecond(0).toDate();

    let cool = await user.cooldown(Cooldowns.InflationPrediction, { force_cooldown, precise: true })
    if (cool) return interaction.editReply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    if (!r || !user.economy.dark?.accuracy) return interaction.editReply({
        embeds: [
            new Embed()
                .defAuthor({ text: "Algo te dice que...", title: true })
                .defDesc(`**No deberías vender con ${now}%**:\n${GetRandomItem([
                    "Tal vez se una buena idea esperar...",
                    "Si confías en ti, puedes esperar otro poco.",
                    "Cierra los ojos y espera un poco más.",
                    "Puede que no sea el momento...",
                    "Puede que esperar aún más, no sea mala idea.",
                    "¿Qué es lo peor que podría pasar?"
                ])}`)
                .defFooter({ text: `Usaste ${user.economy.dark?.accuracy ?? 0}% de tu precisión para intentar predecir qué hacer.`, icon: client.EmojisObject.Error.url, timestamp: true })
                .defColor(Colores.negro)
        ]
    })

    return interaction.editReply({
        embeds: [
            new Embed()
                .defAuthor({ text: "Algo te dice que...", title: true })
                .defDesc(`**Deberías vender con ${now}%**:\n${GetRandomItem([
                    "Venga, inténtalo, hazlo ya.",
                    "Como veo la cosa, cámbialos ya.",
                    "Contra todo pronostico, es momento.",
                    "Es la hora, no esperes más.",
                    "Es ahora o nunca.",
                    "Confia en tu instinto, ve por todo.",
                    "¿Qué es lo peor que podría pasar?"
                ])}`)
                .defFooter({ text: `Usaste ${user.economy.dark?.accuracy ?? 0}% de tu precisión para intentar predecir qué hacer.`, icon: client.EmojisObject.Check.url, timestamp: true })
                .defColor(Colores.negro)
        ]
    })
}

module.exports = command;