const { codeBlock, messageLink, hyperlink } = require("discord.js");
const { Colores } = require("../../../src/resources");
const { Command, Confirmation, FindNewId, Embed, ChannelModules, Log, LogReasons, Cooldowns, Enum, ModifierType, RequirementType, Multipliers, InteractivePages } = require("../../../src/utils");
const { BadParamsError, AlreadyExistsError, DoesntExistsError } = require("../../../src/errors");

const command = new Command({
    name: "config",
    desc: "Todo lo relacionado con el comportamiento de Jeffrey Bot en el servidor"
})

const maxValue = 1024; // api limit
const descValue = 50; // menuselectorlimit (warns, tickets)
const explLength = maxValue - 85 - descValue;

const CooldownChoices = new Enum(Cooldowns).complexArray({ valueString: true });
CooldownChoices.splice(CooldownChoices.findIndex(x => x.name === "InflationPrediction"), 1)

const MultiplierChoices = new Enum(Multipliers).complexArray({ valueString: true });
const RequirementTypesChoices = new Enum(RequirementType).complexArray();

command.data
    .addSubcommand(dashboard =>
        dashboard
            .setName("dashboard")
            .setDescription("Obtén el link para la Dashboard de este servidor, y poder configurarlo")
    )
    .addSubcommandGroup(reglas =>
        reglas
            .setName("reglas")
            .setDescription("Todo lo relacionado con la configuración de las reglas")
            .addSubcommand(add =>
                add
                    .setName("add")
                    .setDescription("Agrega una regla nueva")
                    .addStringOption(nombre =>
                        nombre
                            .setName("nombre")
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
    .addSubcommandGroup(cooldowns =>
        cooldowns
            .setName("cooldowns")
            .setDescription("Toda la configuración de los cooldowns")
            .addSubcommand(base =>
                base
                    .setName("base")
                    .setDescription("Cambia el cooldown base de diferentes módulos")
                    .addStringOption(modulo => modulo
                        .setName("modulo")
                        .setDescription("El módulo a modificar")
                        .addChoices(...CooldownChoices)
                        .setRequired(true)
                    )
                    .addStringOption(cool => cool
                        .setName("cooldown")
                        .setDescription("El cooldown que se tomará como base. (1d, 10m, 1w, 30s)")
                        .setRequired(true)
                    )
            )
            .addSubcommand(modify =>
                modify
                    .setName("modificar")
                    .setDescription("Cambia el cooldown de acuerdo a un requerimiento [NO se acumulan]")
                    .addStringOption(modulo => modulo
                        .setName("modulo")
                        .setDescription("El módulo a modificar")
                        .addChoices(...CooldownChoices)
                        .setRequired(true)
                    )
                    .addIntegerOption(tipo => tipo
                        .setName("tipo")
                        .setDescription("El tipo de requerimiento")
                        .addChoices(...RequirementTypesChoices)
                        .setRequired(true)
                    )
                    .addNumberOption(o => o
                        .setName("modificador")
                        .setDescription("La base se multiplicará por este valor: (0 sería eliminar el cooldown, 1 el mismo, más a 1 se sube.)")
                        .setMinValue(0)
                        .setRequired(true)
                    )
                    .addIntegerOption(lvl => lvl
                        .setName("nivel")
                        .setDescription("El nivel al que se aplicará este modificador")
                        .setMinValue(1)
                    )
                    .addRoleOption(role => role
                        .setName("role")
                        .setDescription("El role que se necesita para que se aplique el modificador")
                    )
            )
    )
    .addSubcommand(addmult =>
        addmult
            .setName("add-multi")
            .setDescription("Agregar un modificador de multiplicador. [Acumulables]")
            .addStringOption(modulo => modulo
                .setName("modulo")
                .setDescription("El módulo a modificar")
                .addChoices(...MultiplierChoices)
                .setRequired(true)
            )
            .addIntegerOption(tipo => tipo
                .setName("tipo")
                .setDescription("El tipo de requerimiento")
                .addChoices(...RequirementTypesChoices)
                .setRequired(true)
            )
            .addNumberOption(o => o
                .setName("modificador")
                .setDescription("Estos modificadores se suman al inicial, que es 1: (0 no hace nada, 1 sería el doble)")
                .setMinValue(0)
                .setRequired(true)
            )
            .addIntegerOption(lvl => lvl
                .setName("nivel")
                .setDescription("El nivel al que se aplicará este modificador")
                .setMinValue(1)
            )
            .addRoleOption(role => role
                .setName("role")
                .setDescription("El role que se necesita para que se aplique el modificador")
            )
    )
    .addSubcommand(delmodify =>
        delmodify
            .setName("del-modif")
            .setDescription("Elimina un modificador por su ID")
            .addIntegerOption(id => id
                .setName("id")
                .setDescription("La ID del modificador.")
                .setRequired(true)
            )
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Guilds } = models;
    const { subcommand, subgroup } = params;

    const docGuild = params.getDoc();

    switch (subcommand) {
        case "dashboard":
            await interaction.editReply({
                content: `${process.env.HOME_PAGE}/dashboard/${interaction.guild.id}`
            })
            break

        case "add-multi":
            const { modulo, modificador, tipo, nivel, role } = params[subcommand];

            if (
                (!nivel && !role) ||
                (Number(tipo.value) === RequirementType.Level && !nivel) ||
                (Number(tipo.value) === RequirementType.Role && !role)
            )
                throw new BadParamsError(interaction, ["Debe haber un nivel o un role", "De acuerdo al tipo elegido"]);

            const newId = FindNewId(await Guilds.find(), "settings.modifiers", "id");

            docGuild.settings.modifiers.push({
                type: ModifierType.Multiplier,
                module: modulo.value,
                multiplier: modificador.value,
                requirement: nivel ? Number(nivel.value) : String(role.value),
                req_type: tipo.value,
                id: newId
            })

            await docGuild.save();

            interaction.editReply({
                embeds: [new Embed({
                    type: "success",
                    data: {
                        desc: [
                            "Se ha agregado el modificador",
                            `ID: \`${newId}\``
                        ]
                    }
                })]
            })
            break;

        case "del-modif":
            const { id } = params[subcommand];
            // modulo, cooldown
            let index = docGuild.settings.modifiers.findIndex(x => x.id === id.value);
            docGuild.settings.modifiers.splice(index, 1);

            await docGuild.save();

            interaction.editReply({
                embeds: [new Embed({
                    type: "success"
                })]
            })
            break;
    }

    switch (subgroup) {
        case "reglas":
            await command.execReglas(interaction, models, docGuild, params);
            break;

        case "cooldowns":
            await command.execCooldowns(interaction, models, docGuild, params);
            break;
    }

    let message = await interaction.fetchReply();

    return subcommand != "dashboard" ? await new Log(interaction)
        .setTarget(ChannelModules.StaffLogs)
        .setReason(LogReasons.Settings)
        .send({
            embeds: [
                new Embed()
                    .defAuthor({ text: `Cambios en la configuración`, title: true })
                    .defDesc(`**—** **${interaction.user.username}** hizo cambios en la configuración del bot.
**—** En \`/config (...?) ${subcommand ?? subgroup}\`: ${hyperlink("Mensaje", messageLink(interaction.channel.id, message.id))}`)
                    .defColor(Colores.verde)
                    .defFooter({ timestamp: true })
            ]
        }) : null;
}

command.execReglas = async (interaction, models, doc, params) => {
    const { subcommand, reglas } = params;
    const { Guilds, Users } = models;
    const { nombre, expl, id, pos, desc } = reglas;

    const regla = doc.data.rules.find(x => x.id === id?.value) ?? null;

    switch (subcommand) {
        case "add": {
            const newId = FindNewId(await Guilds.find(), "data.rules", "id");
            const newPos = FindNewId(doc, "data.rules", "position");
            let confirm = [
                `Nombre: **${nombre.value}**.`,
                `Y como explicación sería:
${codeBlock("markdown", expl.value)}`,
                `ID: \`${newId}\`.`,
                `Posición: \`${newPos}\`.`
            ]

            let confirmation = await Confirmation("Agregar regla", confirm, interaction);
            if (!confirmation) return;

            doc.data.rules.push({
                name: nombre.value,
                expl: expl.value,
                position: newPos,
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
                                `Nombre: **${nombre.value}**`,
                                `Explicación: **'** ${expl.value} **'**`,
                                `ID: \`${newId}\``
                            ]
                        }
                    })
                ]
            })
        }
        case "remove": {
            if (!regla) throw new DoesntExistsError(interaction, `Regla con ID \`${id.value}\``);

            let confirm = [
                `Regla con ID: \`${regla.id}\`.`,
                `Nombre: **${regla.name}**.`,
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
            if (doc.data.rules.find(x => x.position === pos.value))
                throw new AlreadyExistsError(interaction, "Una regla con esa posición", "este servidor");

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
            let items = new Map();

            for (const rule of doc.data.rules) {
                let name = rule.name;
                let expl = rule.expl;
                let desc = rule.desc ?? "No definida.";
                let pos = rule.position;
                let id = rule.id;

                items.set(id, {
                    name,
                    expl,
                    desc,
                    pos,
                    id
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de reglas",
                footer: `Hay ${doc.data.rules.length} regla(s) | Pagina {ACTUAL} de {TOTAL}`,
                color: Colores.verde,
                footer_icon: interaction.guild.iconURL({ dynamic: true }),
                description: `Usa los comandos en ${interaction.client.mentionCommand("config reglas")} para administrar lo que ves aquí.`,
                addon: `**— {name}**\n**▸ Explicación**: {expl}\n**▸ Descripción**: {desc}\n**▸ Posición**: {pos}\n**▸ ID**: {id}\n\n`
            }, items, 3);

            return interactive.init(interaction);
        }
    }
}

command.execCooldowns = async (interaction, models, doc, params) => {
    const { subcommand, cooldowns } = params;
    const { Guilds } = models;
    const { modulo, cooldown, tipo, modificador, nivel, role, id } = cooldowns;

    switch (subcommand) {
        case "base":
            // modulo, cooldown
            doc.settings.cooldowns[modulo.value] = cooldown.value;

            interaction.editReply({
                embeds: [new Embed({
                    type: "success"
                })]
            })
            break;

        case "modificar":
            // modulo, tipo, modificador, nivel, role
            if (
                (!nivel && !role) ||
                (Number(tipo.value) === RequirementType.Level && !nivel) ||
                (Number(tipo.value) === RequirementType.Role && !role)
            )
                throw new BadParamsError(interaction, ["Debe haber un nivel o un role", "De acuerdo al tipo elegido"]);

            const newId = FindNewId(await Guilds.find(), "settings.modifiers", "id");

            doc.settings.modifiers.push({
                type: ModifierType.Cooldown,
                module: modulo.value,
                multiplier: modificador.value,
                requirement: nivel ? Number(nivel.value) : String(role.value),
                req_type: tipo.value,
                id: newId
            })

            interaction.editReply({
                embeds: [new Embed({
                    type: "success",
                    data: {
                        desc: [
                            "Se ha agregado el modificador",
                            `ID: \`${newId}\``
                        ]
                    }
                })]
            })
            break;
    }

    await doc.save();
}

module.exports = command;