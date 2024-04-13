const { SlashCommandIntegerOption, SlashCommandStringOption } = require("discord.js");
const { Command, Enum, BoostTypes, BoostObjetives, ItemObjetives, FindNewId, Embed } = require("../../../src/utils");
const { DoesntExistsError, BadParamsError } = require("../../../src/errors");

const ms = require("ms");

const command = new Command({
    name: "admin-keys",
    desc: "Administración de las llaves del servidor"
})

command.data.
    addSubcommand(dinero => dinero
        .setName("dinero")
        .setDescription("Crear llave con recompensas de dinero")
    )
    .addSubcommand(exp => exp
        .setName("exp")
        .setDescription("Crear llave con recompensas de EXP")
    )
    .addSubcommand(role => role
        .setName("role")
        .setDescription("Crear llave con recompensa de Role")
        .addRoleOption(option => option
            .setName("role")
            .setDescription("Role a dar")
            .setRequired(true)
        )
    )
    .addSubcommand(boost => boost
        .setName("boost")
        .setDescription("Crear llave con recompensa de Boost")
        .addIntegerOption(option => option
            .setName("tipo")
            .setDescription("El tipo de boost que va a ser")
            .addChoices(...new Enum(BoostTypes).complexArray())
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName("objetivo")
            .setDescription("Lo que va a modificar")
            .addChoices(...new Enum(BoostObjetives).complexArray())
            .setRequired(true)
        )
        .addNumberOption(option => option
            .setName("valor")
            .setDescription("Valor del boost")
            .setMinValue(1.1)
            .setRequired(true)
        )
        .addRoleOption(option => option
            .setName("role")
            .setDescription("Role a dar con el Boost")
        )

    )
    .addSubcommand(remove => remove
        .setName("remove")
        .setDescription("Elimina una llave por su ID")
        .addIntegerOption(o => o
            .setName("id")
            .setDescription("La ID de la llave")
            .setMinValue(1)
            .setRequired(true)
        )
    )

command.addOptionsTo(["dinero", "exp"], [
    new SlashCommandIntegerOption()
        .setName("cantidad")
        .setDescription("Cantidad a agregar")
        .setMinValue(1)
        .setRequired(true)
])

command.addOptionsTo(["role", "boost"], [
    new SlashCommandStringOption()
        .setName("duracion")
        .setDescription("Duración: 1d, 20m, 10s, 1y")
])

command.execute = async (interaction, models, params) => {
    await interaction.deferReply();

    const { Guilds } = models;
    const { subcommand } = params;
    const { role, tipo, cantidad, objetivo, valor, duracion, usos, id } = params[subcommand];

    // generar nueva key
    const generatedID = FindNewId(await Guilds.find(), "data.keys", "id");
    const doc = params.getDoc();

    // code
    let generatedCode;
    do {
        generatedCode = generateCode()
    } while (findKey(doc, generatedCode))

    switch (subcommand) {
        case "dinero":
        case "exp":
            if (subcommand === "dinero") type = ItemObjetives.Currency;
            if (subcommand === "exp") type = ItemObjetives.Exp;

            doc.data.keys.push({
                config: {
                    maxuses: usos?.value ?? Infinity
                },
                reward: {
                    type,
                    value: cantidad.value
                },
                code: generatedCode,
                id: generatedID
            });

            await doc.save();
            break;

        case "role":
        case "boost":
            let boost_type = null;
            let boost_value = null;
            let boost_objetive = null;

            if (subcommand === "boost") {
                type = ItemObjetives.Boost;
                boost_type = tipo.value;
                boost_value = valor.value;
                boost_objetive = objetivo.value;
            } else {
                type = ItemObjetives.Role
            }

            const duration = ms(duracion?.value ?? 0);
            if (duration < ms("1m") || isNaN(duration))
                throw new BadParamsError(interaction, "El tiempo debe ser mayor o igual a 1 minuto")

            doc.data.keys.push({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    boost_type,
                    boost_value,
                    boost_objetive,
                    value: role?.value ?? 0,
                    duration
                },
                code: generatedCode,
                id: generatedID
            })

            await doc.save();
            break;

        case "remove":
            let i = doc.data.keys.findIndex(x => x.id === id.value);

            if (i === -1) throw new DoesntExistsError(interaction, `La llave con ID \`${id.value}\``, "este servidor");
            doc.data.keys.splice(i, 1)
            await doc.save();

            return await interaction.editReply({ embeds: [new Embed({ type: "success", data: { desc: "Se ha eliminado la llave" } })] });
    }

    let added = new Embed({ type: "success" })
        .defDesc(`**—** Se ha generado una nueva llave.
**—** \`${generatedCode}\`.
**—** ID: \`${generatedID}\`.`)

    return await interaction.editReply({ embeds: [added] });
}

function generateCode() {
    // generar nueva key
    let chr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let generatedCode = "";

    for (let i = 0; i < 19; i++) {
        // ABCD-EFGH-IJKL-MNOP
        // 0123 5678 9101112 14151617
        if (generatedCode.length === 4 || generatedCode.length === 9 || generatedCode.length === 14) generatedCode += "-"
        else {
            generatedCode += chr.charAt(Math.floor(Math.random() * chr.length));
        }
    }

    return generatedCode;
}

function findKey(doc, key) {
    let q = doc.data.keys.find(x => x.code === key)

    return q ? true : false;
}

module.exports = command;