const { Command, Categories, Confirmation, Embed, ErrorEmbed } = require("../../src/utils");
const moment = require("moment-timezone");
const { time } = require("discord.js");

const command = new Command({
    name: "cumple",
    desc: "Especificas tu fecha de cumpleaños dentro del servidor"
})

command.addSubcommand({
    name: "lock",
    desc: "Bloquear tu fecha de cumpleaños"
})

command.addSubcommand({
    name: "edit",
    desc: "Personaliza tu fecha de cumpleaños en el servidor"
})

command.addOption({
    type: "number",
    name: "dia",
    desc: "Día de tu cumpleaños",
    min: 1,
    max: 31,
    req: true,
    sub: "edit"
})

command.addOption({
    type: "string",
    name: "mes",
    desc: "Mes de cumpleaños",
    choices: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    req: true,
    sub: "edit"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const { subcommand } = params;

    const user = params.getUser();
    switch (subcommand) {
        case "edit":
            const { edit } = params;
            command.execEdit(interaction, models, { user, dia: edit.dia.value, mes: edit.mes.value }, client);
            break;

        case "lock":
            if (user.data.birthday.locked) return interaction.editReply({ embeds: [new ErrorEmbed().defDesc("Aún no ha pasado un año, no puedes continuar.")] });
            command.lock(interaction, models, user, client)
            break;
    }
}

command.lock = async (interaction, models, user, client) => {
    const userBD = user.data.birthday;

    day = userBD.day;
    month = userBD.month;

    if (!(day != null && month != null)) return interaction.editReply({ embeds: [new ErrorEmbed().defDesc("No tienes la fecha completamente configurada, hazlo antes de intentar bloquearla.")] });

    let momentBD = moment().month(month).date(day).startOf("day");
    let bdString = time(momentBD.toDate());

    let toConfirm = [
        "Al bloquear tu fecha, no la podrás cambiar durante un año.",
        "Ese día tendrás acceso a los beneficios del role de cumpleaños.",
        `${bdString}.`
    ];

    let confirmation = await Confirmation("Lock", toConfirm, interaction);
    if (!confirmation) return;

    let hoy = new Date();
    userBD.day = momentBD.date();
    userBD.month = momentBD.month();
    userBD.locked = true;
    userBD.locked_since = hoy;
    user.save();

    confirmation.editReply({
        content: null, embeds: [
            new Embed({
                type: "success",
                data: {
                    title: "Locked"
                }
            })
        ]
    });
}

command.execEdit = async (interaction, models, data, client) => {
    const userBD = data.user.data.birthday;

    // revisar si ya pasó el año desde el lock
    let lockedSince = userBD.locked_since;

    if (moment().isAfter(moment(lockedSince).add(1, "year"))) {
        interaction.editReply(`${client.Emojis.Thinking} Hmmm, si estás usando este comando, ¿será para cambiar algo? he quitado el bloqueo de tu fecha de cumpleaños, reactívala cuando gustes.`);

        userBD.locked = false;
        userBD.locked_since = null;
        await data.user.save();
    }

    if (userBD.locked) return interaction.editReply({ embeds: [new ErrorEmbed().defDesc("Aún no ha pasado un año, no puedes continuar.")] });

    let monthString = data.mes.charAt(0).toUpperCase() + data.mes.slice(1);

    let month = Number(command.data.options.find(x => x.name === "edit")
        .options.find(x => x.name === "mes")
        .choices.findIndex(x => x.name === monthString))

    userBD.day = data.dia;
    userBD.month = month;

    await data.user.save();

    return interaction.editReply({
        content: null, embeds: [
            new Embed({
                type: "success"
            })
        ]
    });
}

module.exports = command;