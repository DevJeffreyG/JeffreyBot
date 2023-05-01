const { SlashCommandStringOption, ButtonStyle, SlashCommandIntegerOption, DiscordAPIError, codeBlock, ActionRowBuilder, TextInputStyle, SlashCommandRoleOption } = require("discord.js");
const { Command, Categories, CustomEmbed, Confirmation, InteractivePages, CustomButton, Modal, CustomTrophy } = require("../../src/utils");
const { Colores } = require("../../src/resources");
const { DiscordLimitationError, DoesntExistsError } = require("../../src/errors");

const command = new Command({
    name: "elements",
    desc: "Administración de elementos personalizados dentro del servidor",
    category: Categories.Staff
})

command.data
    .addSubcommandGroup(embeds => embeds
        .setName("embeds")
        .setDescription("Administración de los Embeds")
        .addSubcommand(create => create
            .setName("create")
            .setDescription("Crea un nuevo Embed")
        )
        .addSubcommand(edit => edit
            .setName("edit")
            .setDescription("Edita los Embeds ya creados")
        )
        .addSubcommand(edit => edit
            .setName("del")
            .setDescription("Elimina un Embed")
        )
    )
    .addSubcommandGroup(botones => botones
        .setName("botones")
        .setDescription("Administración de los Botones configurables")
        .addSubcommand(create => create
            .setName("create")
            .setDescription("Creación de un botón agregable a los Embeds")
        )
        .addSubcommand(edit => edit
            .setName("edit")
            .setDescription("Edición de los botones ya agregados")
        )
        .addSubcommand(edit => edit
            .setName("del")
            .setDescription("Elimina un Botón")
        )
        .addSubcommand(link => link
            .setName("link")
            .setDescription("Vincula un botón a un Embed")
            .addIntegerOption(b => b
                .setName("btn-id")
                .setDescription("La ID del Botón")
                .setRequired(true)
            )
            .addIntegerOption(e => e
                .setName("emb-id")
                .setDescription("La ID del Embed")
                .setRequired(true)
            )
        )
    )
    .addSubcommandGroup(trofeos => trofeos
        .setName("trofeos")
        .setDescription("Administración de los Trofeos del servidor")
        .addSubcommand(create => create
            .setName("create")
            .setDescription("Creación de un Trofeo")
        )
        .addSubcommand(edit => edit
            .setName("edit")
            .setDescription("Edición de los Trofeos ya agregados")
        )
        .addSubcommand(req => req
            .setName("req")
            .setDescription("Administración de los requerimentos para desbloquear el Trofeo")
        )
        .addSubcommand(dado => dado
            .setName("dado")
            .setDescription("Administración de lo que se da al desbloquear el Trofeo")
        )
        .addSubcommand(del => del
            .setName("del")
            .setDescription("Elimina un Trofeo")
        )
        .addSubcommand(dar => dar
            .setName("dar")
            .setDescription("Da manualmente un Trofeo a un usuario")
            .addIntegerOption(o => o
                .setName("id")
                .setDescription("La ID del Trofeo")
                .setMinValue(1)
                .setRequired(true)
            )
            .addUserOption(o => o
                .setName("user")
                .setDescription("El usuario al que se va a agregar el Trofeo")
                .setRequired(true)
            )
        )
    )
    .addSubcommand(list => list
        .setName("list")
        .setDescription("Obtén una lista actual de los elementos")
        .addStringOption(type => type
            .setName("tipo")
            .setDescription("¿Qué lista quieres?")
            .setChoices(
                { name: "Embeds", value: "embeds" },
                { name: "Botones", value: "buttons" },
                { name: "Trofeos", value: "trophies" },
            )
            .setRequired(true)
        )
    )
    .addSubcommand(send => send
        .setName("send")
        .setDescription("Envia un Embed por su ID")
        .addIntegerOption(id => id
            .setName("id")
            .setDescription("La ID del Embed")
            .setRequired(true)
        )
    )

command.addOptionsTo(["embeds edit", "botones edit", "embeds del", "botones del", "trofeos del", "trofeos edit", "trofeos req", "trofeos dado"], [
    new SlashCommandIntegerOption()
        .setName("id")
        .setDescription("La ID del elemento a editar")
        .setMinValue(1)
        .setRequired(true)
])

command.addOptionsTo(["botones create", "botones edit"], [
    new SlashCommandStringOption()
        .setName("texto")
        .setDescription("Texto que sale en el botón")
        .setMaxLength(80)
        .setMinLength(1),
    new SlashCommandStringOption()
        .setName("emoji")
        .setDescription("Emoji que sale en el botón")
        .setMaxLength(32)
        .setMinLength(1),
    new SlashCommandStringOption()
        .setName("style")
        .setDescription("El estilo del botón")
        .setChoices(
            { name: "Primary", value: String(ButtonStyle.Primary) },
            { name: "Secondary", value: String(ButtonStyle.Secondary) },
            { name: "Success", value: String(ButtonStyle.Success) },
            { name: "Danger", value: String(ButtonStyle.Danger) },
            { name: "Link", value: String(ButtonStyle.Link) }
        ),
    new SlashCommandStringOption()
        .setName("link")
        .setDescription("El link que este botón abre")
        .setMinLength(1),
    new SlashCommandStringOption()
        .setName("embedids")
        .setDescription("Las ID de los Embed que va a mostrar si este botón se pulsa")
        .setMinLength(1)
])

command.addOptionsTo(["trofeos create", "trofeos edit"], [
    new SlashCommandStringOption()
        .setName("name")
        .setDescription("El nombre de este Trofeo"),
    new SlashCommandStringOption()
        .setName("desc")
        .setDescription("La descripción de este Trofeo"),
    new SlashCommandRoleOption()
        .setName("dado")
        .setDescription("El rol que da este Trofeo al desbloquearse"),
    new SlashCommandRoleOption()
        .setName("req")
        .setDescription("El rol que se necesita para poder desbloquear este Trofeo")
])

command.execute = async (interaction, models, params, client) => {
    const { subgroup, subcommand } = params;
    const { CustomElements, Guilds } = models;

    if (subcommand && !subgroup) await interaction.deferReply();
    const custom = await CustomElements.getOrCreate(interaction.guild.id);
    const doc = await Guilds.getOrCreate(interaction.guild.id);

    switch (subcommand) {
        case "send": {
            let { id } = params[subcommand];

            let dbEmbed = custom.getEmbed(id.value)
            if (!dbEmbed)
                throw new DoesntExistsError(interaction, `El Embed con ID \`${id.value}\``, "este servidor");

            let embed = new CustomEmbed(interaction).create(dbEmbed)
            let components = [];
            let row = new ActionRowBuilder();

            for (const linked of dbEmbed.buttonids) {
                const bId = linked.id;
                let button = custom.getButton(bId);

                if (linked.isAutoRole) {
                    let autorole = doc.getAutoRole(bId);
                    let emote = autorole.emote;
                    button = {
                        texto: autorole.name,
                        emote,
                        style: ButtonStyle.Primary,
                        autorole: true
                    }
                }

                if (button) {
                    let buttonObj = new CustomButton(interaction).create(button);
                    if (!buttonObj.data.url) buttonObj.setCustomId(`BUTTON-${bId}-${linked.isAutoRole}`);

                    row.addComponents(buttonObj);
                }
            }

            if (row.components.length > 0) components.push(row);

            await interaction.channel.send({ embeds: [embed], components });
            return interaction.deleteReply();
        }

        case "list": {
            let { tipo } = params[subcommand];

            let items = new Map();
            let title, addon;

            switch (tipo.value) {
                case "embeds": {
                    title = "Lista de Embeds";
                    addon = `**— {show}**\n**▸ (IDs) {linkedType} vínculados**: {linked}\n**▸ Element ID: {id}**\n\n`

                    for (embed of custom.embeds) {
                        let buttons = "";
                        embed.buttonids.forEach(x => {
                            buttons += `\n- \`${x.id}\` ${x.isAutoRole ? "**(AutoRole)**" : ""}`
                        })

                        items.set(embed.id, {
                            show: embed.title ?? embed.desc,
                            linkedType: "Botones",
                            linked: buttons,
                            id: embed.id
                        })
                    }

                    break;
                }

                case "buttons": {
                    title = "Lista de Botones";
                    addon = `**— {show}**\n**▸ (IDs) {linkedType} vínculados**: {linked}\n**▸ Element ID: {id}**\n\n`

                    for (button of custom.buttons) {
                        items.set(button.id, {
                            show: button.texto ?? button.emoji,
                            linkedType: "Embeds",
                            linked: button.embedids?.join(", "),
                            id: button.id
                        })
                    }

                    break;
                }
                case "trophies": {
                    title = "Lista de Trofeos";
                    addon = `**— {show}**\n**▸ {desc}**\n**▸ Element ID: {id}**\n\n`

                    for (trophy of custom.trophies) {
                        items.set(trophy.id, {
                            show: trophy.name,
                            desc: trophy.desc ?? "Sin descripción",
                            id: trophy.id
                        })
                    }

                    break;
                }
            }

            const interactive = new InteractivePages({
                title,
                author_icon: interaction.guild.iconURL({ dynamic: true }),
                color: Colores.verde,
                addon
            }, items, 5)
            return interactive.init(interaction);
        }
    }

    switch (subgroup) {
        case "embeds":
            return await command.execEmbeds(interaction, models, params, client);
        case "botones":
            return await command.execButtons(interaction, models, params, client);
        case "trofeos":
            return await command.execTrophies(interaction, models, params, client);
    }
}

command.execEmbeds = async (interaction, models, params, client) => {
    const { subcommand, embeds } = params;

    const modal = new Modal(interaction)
        .defId("createCustomEmbed")
        .defTitle("Crear Embed")
        .addInput({ id: "title", label: "El título", placeholder: "Texto que se muestra arriba del todo", style: TextInputStyle.Short })
        .addInput({ id: "icon", label: "URL Icono", placeholder: "Imagen que se muesta a la izquierda del título", style: TextInputStyle.Short })
        .addInput({ id: "desc", label: "La descripción", placeholder: "Texto que sale en la descripción de este Embed", style: TextInputStyle.Paragraph })
        .addInput({ id: "color", label: "El color del Embed (#HEX)", placeholder: "#00ff00, #ff0000, #f0f0f0, #fff", style: TextInputStyle.Short })
        .addInput({ id: "footer", label: "El footer", placeholder: "Texto que se muestra debajo del Embed", style: TextInputStyle.Short });

    switch (subcommand) {
        case "create": {
            await modal.show()
            break;
        }
        case "edit": {
            let { id } = embeds;
            modal.defId("editCustomEmbed-" + id.value);
            await modal.show()
            break;
        }
        case "del": {
            let { id } = embeds;
            return await new CustomEmbed(interaction).delete(id.value);
        }
    }

}

command.execButtons = async (interaction, models, params, client) => {
    const { subcommand, botones } = params;
    await interaction.deferReply();

    try {
        switch (subcommand) {
            case "create": {
                const newButton = new CustomButton(interaction).create(botones);
                let confirmation = await Confirmation("Nuevo Botón", [
                    "El Botón se verá así:",
                    newButton.setDisabled(true)
                ], interaction)

                if (!confirmation) return;
                return await newButton.save();
            }
            case "edit": {
                const { id } = botones;

                return await new CustomButton(interaction).replace(id.value, botones)
            }
            case "del": {
                const { id } = botones;

                return await new CustomButton(interaction).delete(id.value);
            }
            case "link": {
                const { "btn-id": button, "emb-id": embed } = botones;

                return await new CustomButton(interaction).linkWork(button.value, embed.value);
            }
        }

    } catch (err) {
        if (err instanceof DiscordAPIError) throw new DiscordLimitationError(interaction, "Enviar Botón", [
            "No se podría enviar tu Botón",
            "Verifica que el Botón tenga sentido y pueda ser creado",
            codeBlock("js", err)
        ])

        throw err;
    }
}

command.execTrophies = async (interaction, models, params, client) => {
    const { subcommand, trofeos } = params;

    switch (subcommand) {
        case "create": {
            await interaction.deferReply();

            const trophy = new CustomTrophy(interaction).create(trofeos);
            return await trophy.save();
        }

        case "edit": {
            await interaction.deferReply();
            const { id } = trofeos;

            return await new CustomTrophy(interaction).replace(id.value, trofeos);
        }

        case "del": {
            await interaction.deferReply();
            const { id } = trofeos;

            return await new CustomTrophy(interaction).delete(id.value);
        }
    }
}

module.exports = command;