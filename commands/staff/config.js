const { codeBlock, messageLink, hyperlink } = require("discord.js");
const { Colores } = require("../../src/resources");
const { Command, Categories, ErrorEmbed, Confirmation, FindNewId, Embed, ChannelModules, Log, LogReasons } = require("../../src/utils")

const command = new Command({
    name: "config",
    desc: "Todo lo relacionado con el comportamiento de Jeffrey Bot en el servidor",
    category: Categories.Administration
})

const maxValue = 1024; // api limit
const descValue = 50; // menuselectorlimit (warns, tickets)
const explLength = maxValue - 85 - descValue;

command.data
    .addSubcommand(dashboard => 
        dashboard
            .setName("dashboard")
            .setDescription("Obtén el link para la Dashboard de este servidor, y poder configurarlo"))
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
        case "dashboard":
            await interaction.editReply({
                content: `${process.env.HOME_PAGE}/dashboard/${interaction.guild.id}`
            })
            break
    }

    switch (subgroup) {
        case "reglas":
            await command.execReglas(interaction, models, docGuild, params);
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
                    .defDesc(`**—** **${interaction.user.tag}** hizo cambios en la configuración del bot.
**—** En \`/config (...?) ${subcommand ?? subgroup}\`: ${hyperlink("Mensaje", messageLink(interaction.channel.id, message.id))}`)
                    .defColor(Colores.verde)
                    .defFooter({ timestamp: true })
            ]
        }) : null;
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
${codeBlock("markdown", expl.value)}`,
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

            confirmation.editReply({
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

            confirmation.editReply({
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

            interaction.editReply({
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

            interaction.editReply({
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

            interaction.editReply({
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

            interaction.editReply({ embeds: [embed] })
        }
    }
}

module.exports = command;