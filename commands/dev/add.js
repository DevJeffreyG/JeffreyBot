const { BadParamsError } = require("../../src/errors");
const { Command, ItemObjetives, Embed, BoostTypes, BoostObjetives, Confirmation, FindNewId, Enum } = require("../../src/utils")

const command = new Command({
    name: "add",
    desc: "Agrega diferentes elementos a la base de datos"
});

command.data
    .addSubcommand(roulette => roulette
        .setName("roulette-item")
        .setDescription("Agrega un item a la ruleta")
        .addIntegerOption(target => target
            .setName("target")
            .setDescription("Lo que va a ser cambiado si llega a ser seleccionado")
            .setChoices(...new Enum(ItemObjetives).complexArray())
            .setRequired(true)
        )
        .addStringOption(value => value
            .setName("value")
            .setDescription("El valor de lo que fue seleccionado (dios mio usa: - | + | % | *)")
            .setRequired(true)
        )
        .addNumberOption(chance => chance
            .setName("chance")
            .setDescription("La probabilidad de que este item salga en porcentaje (10 -> 10%)")
            .setMinValue(0.01)
            .setMaxValue(100)
            .setRequired(true)
        )
        .addStringOption(duration => duration
            .setName("duration")
            .setDescription("Si es un boost ¿cuál es su duración? (1d, 10m, etc)")
        )
        .addIntegerOption(option => option
            .setName("boosttype")
            .setDescription("El tipo de boost")
            .addChoices(...new Enum(BoostTypes).complexArray())
        )
        .addIntegerOption(option => option
            .setName("boostobj")
            .setDescription("Lo que va a modificar")
            .addChoices(...new Enum(BoostObjetives).complexArray())
        )
        .addNumberOption(option => option
            .setName("boostvalue")
            .setDescription("Valor del boost (se pueden usar menores que 1)")
            .setMinValue(0.01)
        )
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { RouletteItems } = models;
    const { subcommand } = params
    const { target, value, chance, special, duration, boosttype, boostobj, boostvalue } = params[subcommand]

    switch (subcommand) {
        case "roulette-item":
            if (value.value.replace(/[0-9\.]/g, "").length === 0)
                throw new BadParamsError(interaction, "Dios mío que uses +-*% por favor");
            if (Number(target.value) === ItemObjetives.Boost && !duration)
                throw new BadParamsError(interaction, "Si es un Boost, `duration` debe existir")

            if (value.value.replace(/[0-9\.]/g, "") === "%") {
                let confirmation = await Confirmation("Seguro", ["100% es la cantidad que ya se tiene", "Menos de 100% se resta", "Más de 100% se empieza a subir"], interaction);

                if (!confirmation) return;
            }

            let extra = {
                duration: duration?.value,
                boosttype: Number(boosttype?.value),
                boostobj: Number(boostobj?.value),
                boostvalue: boostvalue?.value
            }

            await RouletteItems.new({ target: Number(target.value), value: value.value, prob: chance.value, extra }, FindNewId(await RouletteItems.getAll(), "", "id"));
            break
    }

    interaction.editReply({ embeds: [new Embed({ type: "success" })] });
}

module.exports = command;