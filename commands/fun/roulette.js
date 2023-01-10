const { Command, Categories, ItemObjetives, BoostObjetives, WillBenefit, Embed, Cooldowns } = require("../../src/utils")
const Chance = require("chance");
const moment = require("moment");
const RouletteItem = require("../../src/utils/RouletteItem");

const command = new Command({
    name: "roulette",
    desc: "Gira la ruleta diariamente para conseguir premios o CASTIGOS",
    category: Categories.Fun
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { GlobalDatas, Users } = models;

    const user = await Users.getOrCreate({user_id: interaction.user.id, guild_id: interaction.guild.id});
    let cool = await user.cooldown(Cooldowns.Roulette)
    if(cool) return interaction.editReply({content: null, embeds: [
        new Embed({type: "cooldown", data: {cool}})
    ]});

    const rouletteItems = await GlobalDatas.getRouletteItems();

    console.log("🟢 Items disponibles: %s", rouletteItems.length);

    const randomItem = await getRandom(rouletteItems);
    if(randomItem === -1){
        user.delCooldown("roulette")
        return interaction.editReply({content: "No me la vas a creer, pero no pude encontrar un item indicado para ti :("})
    }
    const item = await new RouletteItem(interaction, randomItem).build();

    await item.use()

    
    async function getRandom(query) {
        let returnable = null;

        let start = new Date()

        while (!returnable) {
            let date = new Date()
            let q = new Chance().pickone(query).info;

            //console.log("⚪ Checking %s", q.prob)
            let selected = new Chance().bool({ likelihood: q.prob });
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