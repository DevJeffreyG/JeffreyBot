const { Colores } = require("../../src/resources");
const { Command, Categories, ErrorEmbed, Confirmation, FindNewId, Embed } = require("../../src/utils")

const command = new Command({
    name: "config",
    desc: "Todo lo relacionado con el comportamiento de Jeffrey Bot en el servidor",
    category: Categories.Administration
})

const maxValue = 1024; // api limit
const descValue = 50; // menuselectorlimit (warns, tickets)
const explLength = maxValue - 85 - descValue;

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
                        { name: "General logs", value: "general logs" },
                        { name: "Moderation logs", value: "moderation logs" },
                        { name: "Opinion logs", value: "opinion logs" },
                    )
            )
            .addChannelOption(nuevo =>
                nuevo
                    .setName("nuevo")
                    .setDescription("El canal nuevo")
                    .setRequired(true)
            )
    )
    .addSubcommand(min => min
        .setName("min")
        .setDescription("Establece el mínimo de algún módulo")
        .addStringOption(o => o
            .setName("modulo")
            .setDescription("El módulo a configurar")
            .setChoices(
                { name: "Blackjack Bet", value: "blackjack bet" }
            )
            .setRequired(true)
        )
        .addNumberOption(o => o
            .setName("cantidad")
            .setDescription("La cantidad mínima necesaria para que funcione")
            .setMinValue(0.1)
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
                                { name: "Admin", value: "admin" },
                                { name: "Staff", value: "staff" },
                                { name: "Members", value: "members" },
                                { name: "Bots", value: "bots" },
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
                                { name: "Admin", value: "admin" },
                                { name: "Staff", value: "staff" },
                                { name: "Members", value: "members" },
                                { name: "Bots", value: "bots" },
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
                            .setMaxLength(50)
                            .setRequired(true)
                    )
                    .addStringOption(expl =>
                        expl
                            .setName("expl")
                            .setDescription("Explicación detallada de la regla")
                            .setMaxLength(explLength)
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
                            .setMinValue(1)
                            .setMaxValue(9999)
                            .setRequired(true)
                    )
            )
            .addSubcommand(desc =>
                desc
                    .setName("desc")
                    .setDescription("Cambia la descripción de una regla (Resumen de la explicación completa)")
                    .addIntegerOption(id =>
                        id
                            .setName("id")
                            .setDescription("La id de la regla")
                            .setRequired(true)
                    )
                    .addStringOption(desc =>
                        desc
                            .setName("desc")
                            .setDescription("La nueva descripción de la regla")
                            .setMaxLength(descValue)
                            .setRequired(true)
                    )
            )
            .addSubcommand(expl =>
                expl
                    .setName("expl")
                    .setDescription("Cambia la explicación de una regla")
                    .addIntegerOption(id =>
                        id
                            .setName("id")
                            .setDescription("La id de la regla")
                            .setRequired(true)
                    )
                    .addStringOption(expl =>
                        expl
                            .setName("expl")
                            .setDescription("La nueva explicación de la regla")
                            .setMaxLength(explLength)
                            .setRequired(true)
                    )
            )
            .addSubcommand(list =>
                list
                    .setName("list")
                    .setDescription("Obtén la lista de las reglas en este servidor")
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

        case "min":
            await command.execMin(interaction, docGuild, params);
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
            return new ErrorEmbed(interaction, { type: "commandError", data: { id, unknown: modulo.value } }).send()
    }

    await doc.save();
    return interaction.editReply({ content: `✅ Actualizado ➡️ ${nuevo.channel}` });
}

command.execMin = async (interaction, doc, params) => {
    const { modulo, cantidad } = params.min

    switch (modulo.value) {
        case "blackjack bet":
            doc.settings.minimum.blackjack_bet = Math.ceil(cantidad.value);
            break;

        default:
            return new ErrorEmbed(interaction, { type: "commandError", data: { id, unknown: modulo.value } }).send()
    }

    await doc.save();
    return interaction.editReply({ content: `✅ Actualizado ➡️ ${Math.ceil(cantidad.value)}` });
}

command.execRoles = async (interaction, doc, params) => {
    const { subcommand, roles } = params;
    const { modulo, role } = roles;

    let q = modulesSwitch()
    switch (subcommand) {
        case "add":
            if (!q.exists) q.arr.push(role.value) // si no existe, bien, agregarlo
            else return new ErrorEmbed(interaction, {
                type: "alreadyExists",
                data: { action: `add ${modulo.value}`, existing: role.role }
            }).send();
            break;
        case "remove":
            if (!q.exists) return new ErrorEmbed({
                type: "doesntExist",
                data: { action: `remove ${modulo.value}`, missing: role.role }
            }).send();

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
    const { Guilds, Users } = models;
    const { resumen, expl, id, pos, desc } = reglas;

    const regla = doc.data.rules.find(x => x.id === id?.value) ?? null;

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
            if (!confirmation) return;

            doc.data.rules.push({
                name: resumen.value,
                expl: expl.value,
                position: newId,
                id: newId
            });

            await doc.save();

            return confirmation.editReply({
                embeds: [
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
                ]
            })
        }
        case "remove": {
            if (!regla) return new ErrorEmbed(interaction, {
                type: "doesntExist",
                data: { action: `remove regla`, missing: `Regla con ID ${id.value}` }
            }).send();

            let confirm = [
                `Regla con ID: \`${regla.id}\`.`,
                `Resumen: **${regla.name}**.`,
                `Explicación: **${regla.expl}**.`,
                `Descripción simple: **${regla.desc ?? "Nada"}**.`,
                `Posición: \`${regla.position}\`.`,
                "Se eliminarán Warns & Softwarns por esta regla de los usuarios.",
                "Esta acción **NO** se puede deshacer."
            ]

            let confirmation = await Confirmation("Eliminar regla", confirm, interaction);
            if (!confirmation) return;

            let index = doc.data.rules.indexOf(regla)
            doc.data.rules.splice(index, 1);
            await doc.save();

            // eliminar de los usuarios
            const users = await Users.find({ guild_id: interaction.guild.id });
            let totalUsers = 0
            for await (const user of users) {
                let deleted = false;
                let iWarns = user.warns.findIndex(x => x.rule_id === regla.id)
                let iSoftWarns = user.softwarns.findIndex(x => x.rule_id === regla.id)

                if (iWarns != -1) {
                    console.log("🗑️ Eliminando de los Warns de %s", user.user_id)
                    user.warns.splice(iWarns, 1);
                    await user.save();
                    deleted = true;
                }

                if (iSoftWarns != -1) {
                    console.log("🗑️ Eliminando de los SoftWarns de %s", user.user_id)
                    user.softwarns.splice(iSoftWarns, 1);
                    await user.save();
                    deleted = true;
                }

                if (deleted) totalUsers += 1
            }

            return confirmation.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: [
                                "Se ha eliminado la regla",
                                `Se han eliminado los Warns y Softwarns para esta regla de ${totalUsers} usuario(s)`
                            ]
                        }
                    })
                ]
            })
        }

        case "pos": {
            // revisar que no haya una regla con esa posicion
            if (doc.data.rules.find(x => x.position === pos.value)) return new ErrorEmbed(interaction, {
                type: "alreadyExists",
                data: {
                    action: "reglas pos",
                    existing: "Una regla con esa posición",
                    context: "este servidor"
                }
            }).send();

            regla.position = pos.value;
            await doc.save();

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: `Se cambió la posición a la \`${pos.value}\``
                        }
                    })
                ]
            })

        }

        case "desc": {
            regla.desc = desc.value;
            await doc.save();

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: `Se cambió la descripción`
                        }
                    })
                ]
            })
        }

        case "expl": {
            const regla = doc.data.rules.find(x => x.id === id.value);

            regla.expl = expl.value;
            await doc.save();

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: `Se cambió la explicación`
                        }
                    })
                ]
            })
        }

        case "list": {
            let embed = new Embed()
                .defAuthor({ text: "Lista de reglas", title: true })
                .defFooter({ text: `Hay ${doc.data.rules.length} regla(s)`, icon: interaction.guild.iconURL({ dynamic: true }) })
                .defDesc("Usa los comandos en `/config reglas` para administrar lo que ves aquí.")
                .defColor(Colores.verde);

            for (const rule of doc.data.rules) {
                let name = rule.name;
                let expl = rule.expl;
                let desc = rule.desc ?? "No definida.";
                let pos = rule.position;
                let id = rule.id;

                embed.defField(`— ${name}`, `**▸ Explicación**: \`${expl}\`
**▸ Descripción**: \`${desc}\`
**▸ Posición**: \`${pos}\`.
**▸ ID**: \`${id}\`.`)
            }

            return interaction.editReply({ embeds: [embed] })
        }
    }
}

module.exports = command;