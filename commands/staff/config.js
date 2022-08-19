const { Command, ErrorEmbed, Confirmation, FindNewId, Embed } = require("../../src/utils")

const command = new Command({
    name: "config",
    desc: "Todo lo relacionado con el comportamiento de Jeffrey Bot en el servidor",
    category: "ADMIN"
})

command.data
    .addSubcommand(canales => 
        canales
            .setName("canales")
            .setDescription("Cambiar la configuración de canales")
            .addStringOption(modulo => 
                modulo
                    .setName("modulo")
                    .setDescription("El módulo a cambiar")
                    .setRequired(true)
                    .addChoices(
                            {name: "General logs", value: "general logs"},
                            {name: "Moderation logs", value: "moderation logs"},
                            {name: "Opinion logs", value: "opinion logs"},
                        )
            )
            .addChannelOption(nuevo =>
                nuevo
                    .setName("nuevo")
                    .setDescription("El canal nuevo")
                    .setRequired(true)
            )
    )
    .addSubcommandGroup(roles =>
        roles
            .setName("roles")
            .setDescription("Todo lo relacionado con la configuración de los roles")
            .addSubcommand(add =>
                add
                    .setName("add")
                    .setDescription("Agregar un rol a un módulo")
                    .addStringOption(modulo =>
                        modulo
                            .setName("modulo")
                            .setDescription("El módulo a cambiar")
                            .setRequired(true)
                            .addChoices(
                                {name: "Admin", value: "admin"},
                                {name: "Staff", value: "staff"},
                                {name: "Members", value: "members"},
                                {name: "Bots", value: "bots"},
                            )
                    )
                    .addRoleOption(role =>
                        role
                            .setName("role")
                            .setDescription("El rol a agregar")
                            .setRequired(true)
                    )
            )
            .addSubcommand(remove =>
                remove
                    .setName("remove")
                    .setDescription("Eliminar un rol de un módulo")
                    .addStringOption(modulo =>
                        modulo
                            .setName("modulo")
                            .setDescription("El módulo a cambiar")
                            .setRequired(true)
                            .addChoices(
                                {name: "Admin", value: "admin"},
                                {name: "Staff", value: "staff"},
                                {name: "Members", value: "members"},
                                {name: "Bots", value: "bots"},
                            )
                    )
                    .addRoleOption(role =>
                        role
                            .setName("role")
                            .setDescription("El rol a eliminar")
                            .setRequired(true)
                    )
            )
    )
    .addSubcommandGroup(reglas =>
        reglas
            .setName("reglas")
            .setDescription("Todo lo relacionado con la configuración de las reglas")
            .addSubcommand(add =>
                add
                    .setName("add")
                    .setDescription("Agrega una regla nueva")
                    .addStringOption(resumen =>
                        resumen
                            .setName("resumen")
                            .setDescription("Lo que engloba toda la regla")
                            .setRequired(true)
                    )
                    .addStringOption(expl =>
                        expl
                            .setName("expl")
                            .setDescription("Explicación detallada de la regla")
                            .setRequired(true)
                    )
            )
            .addSubcommand(remove =>
                remove
                    .setName("remove")
                    .setDescription("Elimina una regla por su id")
                    .addIntegerOption(id =>
                        id
                            .setName("id")
                            .setDescription("La id de la regla")
                            .setRequired(true)
                    )
            )
            .addSubcommand(pos =>
                pos
                    .setName("pos")
                    .setDescription("Cambia la posición de una regla")
                    .addIntegerOption(id =>
                        id
                            .setName("id")
                            .setDescription("La id de la regla")
                            .setRequired(true)
                    )
                    .addIntegerOption(pos =>
                        pos
                            .setName("pos")
                            .setDescription("La nueva posición de la regla")
                            .setRequired(true)
                    )
            )
    )

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

        case "reglas":
            await command.execReglas(interaction, models, docGuild, params);
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

    let q = modulesSwitch()
    switch (subcommand) {
        case "add":
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

command.execReglas = async (interaction, models, doc, params) => {
    const { subcommand, reglas } = params;
    const { Guilds } = models;
    const { resumen, expl, id, pos } = reglas;

    switch (subcommand) {
        case "add": {
            const newId = await FindNewId(await Guilds.find(), "data.rules", "id");
            let confirm = [
                `General: **${resumen.value}**.`,
                `Y como explicación sería:
\`\`\`markdown
${expl.value}
\`\`\``,
                `ID & Posición: \`${newId}\`.`
            ]

            let confirmation = await Confirmation("Agregar regla", confirm, interaction);
            if(!confirmation) return;

            doc.data.rules.push({
                name: resumen.value,
                expl: expl.value,
                position: newId,
                id: newId
            });

            await doc.save();

            return confirmation.editReply({embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            "Se ha creado la nueva regla",
                            `Resumen: **${resumen.value}**`,
                            `Explicación: **'** ${expl.value} **'**`,
                            `ID: \`${newId}\``
                        ]
                    }
                })
            ]})
        }
        case "remove": {
            const regla = doc.data.rules.find(x => x.id === id.value);
            if (!regla) return interaction.editReply({
                content: null, embeds: [
                    new ErrorEmbed({
                        type: "doesntExist",
                        data: { action: `remove regla`, missing: `Regla con ID ${id.value}` }
                    })
                ]
            })

            let confirm = [
                `Regla con ID: \`${regla.id}\`.`,
                `Resumen: **${regla.name}**.`,
                `Explicación: **${regla.expl}**.`,
                `Descripción simple: **${regla.desc ?? "Nada"}**.`,
                `Posición: \`${regla.position}\`.`
            ]

            let confirmation = await Confirmation("Eliminar regla", confirm, interaction);
            if(!confirmation) return;

            let index = doc.data.rules.indexOf(regla)
            doc.data.rules.splice(index, 1);
            await doc.save();

            return confirmation.editReply({embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            "Se ha eliminado la regla"
                        ]
                    }
                })
            ]})
        }
    }
}

module.exports = command;