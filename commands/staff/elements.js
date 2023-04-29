const { SlashCommandStringOption, ButtonStyle, SlashCommandIntegerOption, DiscordAPIError, codeBlock, ActionRowBuilder, TextInputStyle } = require("discord.js");
const { Command, Categories, CustomEmbed, Confirmation, InteractivePages, CustomButton, Modal } = require("../../src/utils");
const { Colores } = require("../../src/resources");
const { DiscordLimitationError } = require("../../src/errors");

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
    .addSubcommandGroup(buttons => buttons
        .setName("buttons")
        .setDescription("Administración de los botones configurables")
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
    .addSubcommand(list => list
        .setName("list")
        .setDescription("Obtén una lista actual de los elementos")
        .addStringOption(type => type
            .setName("tipo")
            .setDescription("¿Qué lista quieres?")
            .setChoices(
                { name: "Embeds", value: "embeds" },
                { name: "Botones", value: "buttons" },
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

command.addOptionsTo(["embeds edit", "buttons edit", "embeds del", "buttons del"], [
    new SlashCommandIntegerOption()
        .setName("id")
        .setDescription("La ID del elemento a editar")
        .setMinValue(1)
        .setRequired(true)
])

command.addOptionsTo(["buttons create", "buttons edit"], [
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

command.execute = async (interaction, models, params, client) => {
    const { subgroup, subcommand } = params;
    const { CustomElements } = models;

    if (subcommand && !subgroup) await interaction.deferReply();
    const custom = await CustomElements.getOrCreate(interaction.guild.id);

    switch (subcommand) {
        case "send": {
            let { id } = params[subcommand];

            let dbEmbed = custom.getEmbed(id.value)
            let embed = new CustomEmbed(dbEmbed)
            let components = [];
            let row = new ActionRowBuilder();

            for (const bId of dbEmbed.buttonids) {
                const button = custom.getButton(bId);

                if (button) {
                    let buttonObj = new CustomButton(button, interaction);
                    if (!buttonObj.data.url) buttonObj.setCustomId(`BUTTON-${interaction.guild.id}-${bId}`);

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
            let title;

            switch (tipo.value) {
                case "embeds": {
                    title = "Lista de Embeds";

                    for (embed of custom.embeds) {
                        items.set(embed.id, {
                            show: embed.title ?? embed.desc,
                            linkedType: "Botones",
                            linked: embed.buttonids?.join(", "),
                            id: embed.id
                        })
                    }

                    break;
                }

                case "buttons": {
                    title = "Lista de Botones";

                    for (button of custom.buttons) {
                        items.set(button.id, {
                            show: button.texto,
                            linkedType: "Embeds",
                            linked: button.embedids?.join(", "),
                            id: button.id
                        })
                    }

                    break;
                }
            }

            const interactive = new InteractivePages({
                title,
                author_icon: interaction.guild.iconURL({ dynamic: true }),
                color: Colores.verde,
                addon: `**— {show}**\n**▸ (IDs) {linkedType} vínculados: {linked}**\n**▸ ID: {id}**\n\n`
            }, items, 5)
            return interactive.init(interaction);
        }
    }

    switch (subgroup) {
        case "embeds":
            return await command.execEmbeds(interaction, models, params, client);

        case "buttons":
            return await command.execButtons(interaction, models, params, client);
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
            return await new CustomEmbed().delete(id.value, interaction);
        }
    }

}

command.execButtons = async (interaction, models, params, client) => {
    const { subcommand, buttons } = params;

    try {
        switch (subcommand) {
            case "create": {
                const newButton = new CustomButton(buttons, interaction)
                let confirmation = await Confirmation("Nuevo Botón", [
                    "El Botón se verá así:",
                    newButton.setDisabled(true)
                ], interaction)

                if (!confirmation) return;
                return await newButton.save();
            }
            case "edit": {
                const { id } = buttons;

                return new CustomButton(buttons, interaction).replace(id.value)
            }
            case "del": {
                const { id } = buttons;

                return new CustomButton().delete(id.value, interaction);
            }
            case "link": {
                const { "btn-id": button, "emb-id": embed } = buttons;

                return new CustomButton().linkWork(button.value, embed.value, interaction);
            }
        }

    } catch (err) {
        if (err instanceof DiscordAPIError) {
            throw new DiscordLimitationError(interaction, "Enviar Embed", [
                "No se podría enviar tu Botón",
                "Verifica que el Botón tenga sentido y pueda ser creado",
                codeBlock("js", err)
            ])
        }

        throw err;
    }
}

module.exports = command;