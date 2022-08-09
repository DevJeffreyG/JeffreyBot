const { Command, ErrorEmbed } = require("../../src/utils")

const command = new Command({
    name: "config",
    desc: "Todo lo relacionado con el comportamiento de Jeffrey Bot en el servidor",
    category: "STAFF"
})
// CANALES
command.addSubcommand({
    name: "canales",
    desc: "Cambiar la configuración de los canales"
})

command.addOption({
    type: "string",
    name: "modulo",
    desc: "El módulo a cambiar",
    req: true,
    choices: [
        "General logs",
        "Moderation logs",
        "Opinion logs"
    ],
    sub: "canales"
})

command.addOption({
    type: "channel",
    name: "nuevo",
    desc: "El canal nuevo",
    req: true,
    sub: "canales"
})

// ROLES
command.addSubcommandGroup({
    name: "roles",
    desc: "Todo lo relacionado con la configuración de los roles"
})

//add
command.addSubcommand({
    name: "add",
    desc: "Agregar un rol a un módulo",
    group: "roles"
})

command.addOption({
    type: "string",
    name: "modulo",
    desc: "El módulo a cambiar",
    req: true,
    choices: [
        "Admin",
        "Staff",
        "Members",
        "Bots"
    ],
    sub: "roles.add"
})

command.addOption({
    type: "role",
    name: "role",
    desc: "El rol a agregar",
    req: true,
    sub: "roles.add"
})

//remove
command.addSubcommand({
    name: "remove",
    desc: "Eliminar un rol de un módulo",
    group: "roles"
})

command.addOption({
    type: "string",
    name: "modulo",
    desc: "El módulo a cambiar",
    req: true,
    choices: [
        "Admin",
        "Staff",
        "Members",
        "Bots"
    ],
    sub: "roles.remove"
})

command.addOption({
    type: "role",
    name: "role",
    desc: "El rol a eliminar",
    req: true,
    sub: "roles.remove"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Guilds } = models;
    const { subcommand, subgroup } = params;

    const docGuild = await Guilds.getOrCreate(interaction.guild.id);

    switch (subcommand) {
        case "canales":
            await command.execChannel(interaction, docGuild, params);
            break
    }

    switch (subgroup) {
        case "roles":
            await command.execRoles(interaction, docGuild, params);
            break;
    }
}

command.execChannel = async (interaction, doc, params) => {
    const { modulo, nuevo } = params.canales

    const id = nuevo.value;

    switch (modulo.value) {
        case "general logs":
            doc.channels.general_logs = id
            break
        case "moderation logs":
            doc.channels.moderaction_logs = id
            break
        case "opinion logs":
            doc.channels.opinion_logs = id
            break

        default:
            return interaction.editReply({ content: null, embeds: [new ErrorEmbed({ type: "commandError", data: { id, unknown: modulo.value } })] })
    }

    await doc.save();
    return interaction.editReply({ content: `✅ Actualizado ➡️ ${nuevo.channel}` });
}

command.execRoles = async (interaction, doc, params) => {
    const { subcommand, roles } = params;
    const { modulo, role } = roles;

    switch (subcommand) {
        case "add":
            q = modulesSwitch()
            if (!q.exists) q.arr.push(role.value) // si no existe, bien, agregarlo
            else return interaction.editReply({
                content: null, embeds: [
                    new ErrorEmbed({
                        type: "alreadyExists",
                        data: { action: `add ${modulo.value}`, existing: role.role }
                    })
                ]
            })
            break;
        case "remove":
            q = modulesSwitch()
            if (!q.exists) return interaction.editReply({
                content: null, embeds: [
                    new ErrorEmbed({
                        type: "doesntExist",
                        data: { action: `remove ${modulo.value}`, missing: role.role }
                    })
                ]
            })

            let index = q.arr.indexOf(role.value)
            q.arr.splice(index, 1);
            break;
    }

    await doc.save()
    return interaction.editReply({ content: `✅ Actualizado ▶️ ${role.role}` });

    function modulesSwitch() {
        let exists = false;
        let arr = null;

        switch (modulo.value) {
            case "admin":
                arr = doc.getAdmins();
                break

            case "staff":
                arr = doc.getStaffs();
                break;

            case "members":
                arr = doc.getUsers();
                break;

            case "bots":
                arr = doc.getBots();
        }

        if (isIn(arr, role.value)) exists = true;
        return { exists, arr }
    }

    function isIn(arr, id) {
        return arr.find(x => x === id);
    }
}

module.exports = command;