const { Command, Confirmation, Embed} = require("../../src/utils");
const ms = require("ms")

const command = new Command({
    name: "cumple",
    desc: "Especificas tu fecha de cumpleaños dentro del servidor",
    category: "FUN"
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
    await interaction.deferReply({ephemeral: true});

    const { Users } = models;
    const { subcommand } = params;
    
    const user = await Users.getOrCreate({user_id: interaction.user.id, guild_id: interaction.guild.id});

    if(user.data.birthday.locked) return interaction.editReply("Locked ❌");
    
    switch(subcommand){
        case "edit":
            const { edit } = params;
            command.execEdit(interaction, models, {user, dia: edit.dia.value, mes: edit.mes.value}, client);
            break;

        case "lock":
            command.lock(interaction, models, user, client)
            break;
    }
}

command.lock = async (interaction, models, user, client) => {
    const userBD = user.data.birthday;
    
    day = userBD.day;
    month = userBD.month;

    let bdString = day != null && month != null ? `${day} de ${month}` : null;

    if(!bdString) return message.reply(`No tienes la fecha completamente configurada, por favor hazlo antes de bloquearla.`);

    let toConfirm = [
        "Al bloquear tu fecha, no la podrás cambiar durante un año.",
        "Tendrás acceso a los beneficios del role de cumpleaños el día estipulado.",
        `${bdString}.`
    ];

    let confirmation = await Confirmation("Lock", toConfirm, interaction);
    if(!confirmation) return;

    let hoy = new Date();
    userBD.locked = true;
    userBD.locked_since = hoy;
    user.save();

    confirmation.editReply({content: null, embeds: [
        new Embed({
            type: "success",
            data: {
                title: "Locked"
            }
        })
    ]});
}

command.execEdit = async (interaction, models, data, client) => {
    const userBD = data.user.data.birthday;

    // revisar si ya pasó el año desde el lock
    let now = new Date();
    let lockedSince = userBD.locked_since ? userBD.locked_since : now;
    let lockedDuration = ms("365d");

    if(now - lockedSince >= lockedDuration){
        message.reply("hmmm, si estás usando este comando, ¿será para cambiar algo? he quitado el bloqueo de tu fecha de cumpleaños, reactívala cuando gustes.");

        userBD.locked = false;
        userBD.locked_since = null;
        await user.save();
    }

    if(userBD.locked) return interaction.editReply({content: "Locked ❌"});

    userBD.day = data.dia;
    userBD.month = data.mes.charAt(0).toUpperCase() + data.mes.slice(1);

    await data.user.save();
    return interaction.editReply({content: null, embeds: [
        new Embed({
            type: "sucess"
        })
    ]});
}

module.exports = command;