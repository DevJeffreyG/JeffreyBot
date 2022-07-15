const { Command, Embed, importImage, FindNewId } = require("../../src/utils")
const { Config, Colores } = require("../../src/resources")

const ms = require("ms");
const moment = require("moment");

const command = new Command({
    name: "admin",
    desc: "Comandos que administran diferentes secciones dentro de un servidor",
    category: "STAFF"
})

//demasiado complejo como para usar las funciones mias :sob:
command.data
    .addSubcommandGroup(group =>
        group
            .setName("add")
            .setDescription("Añadir...")
            .addSubcommand(sub => sub
                .setName("jeffroskey")
                .setDescription("Añadir una nueva llave para canjear con recompensas de Jeffros")
                .addIntegerOption(option => option
                    .setName("cantidad")
                    .setDescription("Cantidad de Jeffros a dar")
                    .setMinValue(1)
                    .setRequired(true))
            )
            .addSubcommand(sub => sub
                .setName("expkey")
                .setDescription("Añadir una nueva llave para canjear con recompensas de Jeffros")
                .addIntegerOption(option => option
                    .setName("cantidad")
                    .setDescription("Cantidad de EXP a dar")
                    .setMinValue(1)
                    .setRequired(true))
            )
            .addSubcommand(sub => sub
                .setName("rolekey")
                .setDescription("Añadir una nueva llave para canjear con recompensa de Role")
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Role a dar")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("duracion")
                    .setDescription("Duración del role asignado: 1d, 20m, 10s, 1y"))
            )
            .addSubcommand(sub => sub
                .setName("boostkey")
                .setDescription("Añadir una nueva llave para canjear con recompensa de Boost")
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Role a dar")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("tipo")
                    .setDescription("El tipo de boost que va a ser")
                    .addChoices(
                        { name: "Multiplicador", value: "boostMultiplier" },
                        { name: "Probabilidad Boost", value: "boostProbabilities" }
                    )
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("objetivo")
                    .setDescription("Lo que va a modificar")
                    .addChoices(
                        { name: "Jeffros", value: "jeffros" },
                        { name: "EXP", value: "exp" },
                        { name: "Todo", value: "all" },
                    )
                    .setRequired(true))
                .addNumberOption(option => option
                    .setName("valor")
                    .setDescription("Valor del boost")
                    .setMinValue(1.1)
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("duracion")
                    .setDescription("Duración del role asignado: 1d, 20m, 10s, 1y"))

            )
    )

command.addEach({ type: "integer", name: "usos", desc: "Los usos máximos permitidos en global para esta key", min: 1 });

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    switch (params.subgroup) {
        case "add":
            //console.log(params);
            await command.addExec(interaction, models, params, client);
            break;
    }
}

command.addExec = async (interaction, models, params, client) => {
    //console.log(params)
    const { Keys } = models;
    const { subcommand, add } = params;
    const { role, tipo, cantidad, objetivo, valor, duracion, usos } = add;

    // generar nueva key
    let keysq = await Keys.find();
    const generatedID = await FindNewId(keysq, "", "id");

    // code
    let generatedCode = generateCode()
    while (await findKey(generatedCode)) {
        generatedCode = generateCode();
    }

    switch (subcommand) {
        case "jeffroskey":
        case "expkey":
            if (subcommand === "jeffroskey") type = "jeffros";
            if (subcommand === "expkey") type = "exp";

            await new Keys({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    value: cantidad.value
                },
                code: generatedCode,
                id: generatedID
            }).save();
            break;

        case "rolekey":
        case "boostkey":
            let boost_type = null;
            let boost_value = null;
            let boost_objetive = null;

            if (subcommand === "boostkey") {
                type = "boost";
                boost_type = tipo.value;
                boost_value = valor.value;
                boost_objetive = objetivo.value;
            } else {
                type = "role"
            }

            await new Keys({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    boost_type,
                    boost_value,
                    boost_objetive,
                    value: role.value,
                    duration: duracion ? ms(duracion.value) : Infinity
                },
                code: generatedCode,
                id: generatedID
            }).save();

    }

    let added = new Embed()
        .defAuthor({ text: `Listo: ${subcommand}`, icon: Config.bienPng })
        .defDesc(`**—** Se ha generado una nueva llave.
**—** \`${generatedCode}\`.
**—** ID: \`${generatedID}\`.`)
        .setColor(Colores.verde)

    return interaction.editReply({ embeds: [added] });
}

function generateCode() {
    // generar nueva key
    let chr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let generatedCode = "";

    for (let i = 0; i < 19; i++) {
        // ABCD-EFGH-IJKL-MNOP
        // 0123 5678 9101112 14151617
        if (generatedCode.length == 4 || generatedCode.length == 9 || generatedCode.length == 14) generatedCode += "-"
        else {
            generatedCode += chr.charAt(Math.floor(Math.random() * chr.length));
        }
    }

    return generatedCode;
}

async function findKey(key) {
    const { Keys } = require("mongoose").models;
    let q = await Keys.findOne({
        code: key
    });

    return q ? true : false;
}

module.exports = command;