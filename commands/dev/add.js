const { Command, Categories, ItemObjetives, Embed, ItemTypes, BoostTypes, BoostObjetives, ErrorEmbed } = require("../../src/utils")

const command = new Command({
    name: "add",
    desc: "Agrega diferentes elementos a la base de datos",
    category: Categories.Developer
});

command.data
    .addSubcommand(roulette => roulette
        .setName("roulette-item")
        .setDescription("Agrega un item a la ruleta")
        .addStringOption(target => target
            .setName("target")
            .setDescription("Lo que va a ser cambiado si llega a ser seleccionado")
            .setChoices( 
                { name: "Jeffros", value: String(ItemObjetives.Jeffros) },
                { name: "Role", value: String(ItemObjetives.Role) },
                { name: "TempRole", value: String(ItemObjetives.TempRole) }
            )
            .setRequired(true)
        )
        .addStringOption(value => value
            .setName("value")
            .setDescription("El valor de lo que fue seleccionado (dios mio usa: - | + | % | *)")
            .setRequired(true)
        )
        .addNumberOption(chance => chance
            .setName("chance")
            .setDescription("La probabilidad de que este item salga")
            .setMinValue(0.1)
            .setMaxValue(100)
            .setRequired(true)
        )
        .addStringOption(special => special
            .setName("special")
            .setDescription("Algo especial de este item")
            .setChoices(
                { name: "Es un boost", value: String(ItemObjetives.Boost) },
                { name: "Es una sub", value: String(ItemTypes.Subscription) }
            )
        )
        .addStringOption(duration => duration
            .setName("duration")
            .setDescription("Si es una sub o un boost ¿cuál es su duración/intervalo? (1d, 10m, etc)")
        )
        .addStringOption(option => option
            .setName("boosttype")
            .setDescription("El tipo de boost")
            .addChoices(
                { name: "Multiplicador", value: String(BoostTypes.Multiplier) },
                { name: "Probabilidad Boost", value: String(BoostTypes.Probabilities) }
            )
        )
        .addStringOption(option => option
            .setName("boostobj")
            .setDescription("Lo que va a modificar")
            .addChoices(
                { name: "Jeffros", value: String(BoostObjetives.Jeffros) },
                { name: "EXP", value: String(BoostObjetives.Exp) },
                { name: "Todo", value: String(BoostObjetives.All) },
            )
        )
        .addNumberOption(option => option
            .setName("boostvalue")
            .setDescription("Valor del boost (se pueden usar menores que 1)")
            .setMinValue(0.1)
        )
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { GlobalDatas } = models;
    const { subcommand } = params
    const { target, value, chance, special, duration, boosttype, boostobj, boostvalue} = params[subcommand]

    console.log(params)

    switch(subcommand){
        case "roulette-item":
            if(value.value.replace(/[0-9\.]/g, "").length === 0)
                return new ErrorEmbed(interaction, { type: "badParams", data: { help: "Dios mío que uses +-*% por favor"} }).send();
            if (Number(target.value) === ItemObjetives.TempRole && !duration)
                return new ErrorEmbed(interaction, { type: "badParams", data: { help: "Si es un TempRole, 'duration' debe existir" } }).send();

            let extra = {
                special: Number(special?.value),
                duration: duration?.value,
                boosttype: Number(boosttype?.value),
                boostobj: Number(boostobj?.value),
                boostvalue: boostvalue?.value
            }

            await GlobalDatas.newRouletteItem({target: Number(target.value), value: value.value, prob: chance.value, extra });
            break
    }

    interaction.editReply({embeds: [new Embed({type: "success"})]});
}

module.exports = command;