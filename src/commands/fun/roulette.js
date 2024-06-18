const { Command, ItemObjetives, BoostObjetives, WillBenefit, Embed, Cooldowns } = require("../../utils")
const Chance = require("chance");
const moment = require("moment-timezone");
const RouletteItem = require("../../utils/RouletteItem");
const { Colores } = require("../../resources");

const command = new Command({
    name: "roulette",
    desc: "Gira la ruleta para conseguir premios o CASTIGOS"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { RouletteItems } = models;

    const user = params.getUser();
    const doc = params.getDoc();

    let cool = await user.cooldown(Cooldowns.Roulette, { save: false })
    if (cool) return await interaction.editReply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    const notSelected = new Map();
    const rouletteItems = await RouletteItems.getAll();

    console.log("🟢 Items disponibles: %s", rouletteItems.length);

    const randomItem = await getRandom(rouletteItems);

    let avoidedItems = new Embed()
        .defTitle("La ruleta siguió su paso por estos items antes de detenerse:")
        .defColor(Colores.verde);

    for (const [i, item_avoided] of notSelected.entries()) {
        const roulttItem = new RouletteItem(interaction, item_avoided).build(user, doc);
        let info = roulttItem.info();
        avoidedItems.defDesc(`${avoidedItems.data.description ?? ""}\n\`${i}\` **▸** ${info.text} (${info.likelihood}%)`)
    }

    if (randomItem === -1) {
        user.delCooldown(Cooldowns.Roulette)
        await interaction.deleteReply()
        return await interaction.followUp({ ephemeral: true, content: "No me la vas a creer, pero no pude encontrar un item indicado para ti :(" })
    }
    
    const item = new RouletteItem(interaction, randomItem).build(user, doc);

    await item.use()

    if (notSelected.size > 0) {
        await interaction.followUp({
            ephemeral: true, embeds: [
                avoidedItems
            ]
        })
    }

    async function getRandom(query) {
        let returnable = null;

        let start = new Date()
        let i = 0;
        if(query.length === 0) return -1;

        while (!returnable) {
            i++
            let date = new Date()
            let q = new Chance().pickone(query);

            //console.log("⚪ Checking %s", q.prob)
            let selected = new Chance().bool({ likelihood: q.prob });
            if (!selected) notSelected.set(i, q);

            //console.log(selected ? "🟢 Selected" : "🔴 Negative");

            let benefit = false;

            if (q.extra?.special === ItemObjetives.Boost) benefit = await WillBenefit(interaction.member, [q.extra.boostobj, BoostObjetives.All])

            returnable = selected && !benefit ? q : null

            if (moment(date).diff(start, "second") >= 3) returnable = benefit ? -1 : q;
        }

        return returnable
    }
}


module.exports = command