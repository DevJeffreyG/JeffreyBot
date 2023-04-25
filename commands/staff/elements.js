const { SlashCommandStringOption, SlashCommandBooleanOption, SlashCommandAttachmentOption, ButtonStyle, SlashCommandIntegerOption, DiscordAPIError, codeBlock, ActionRowBuilder } = require("discord.js");
const { Command, Categories, CustomEmbed, Confirmation, InteractivePages, CustomButton } = require("../../src/utils");
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

command.addOptionsTo(["embeds create", "embeds edit"], [
    new SlashCommandStringOption()
        .setName("title")
        .setDescription("Texto que se muestra arriba del todo")
        .setMaxLength(256)
        .setMinLength(1),
    new SlashCommandStringOption()
        .setName("icon")
        .setDescription("Imagen que se muestra a la izquierda del título (URL)")
        .setMinLength(1),
    new SlashCommandStringOption()
        .setName("desc")
        .setDescription("La descripción de este Embed")
        .setMinLength(1)
        .setMaxLength(4096),
    new SlashCommandStringOption()
        .setName("color")
        .setDescription("El color Hex de este Embed")
        .setMinLength(1)
        .setMaxLength(6),
    new SlashCommandStringOption()
        .setName("footer")
        .setDescription("Texto que se muestra abajo del Embed")
        .setMinLength(1)
        .setMaxLength(2048),
    new SlashCommandStringOption()
        .setName("footer_icon")
        .setDescription("Imagen que se muestra a la izquierda del footer (URL)")
        .setMinLength(1),
    new SlashCommandBooleanOption()
        .setName("time")
        .setDescription("Mostrar la fecha en el momento que se envíe este Embed"),
    new SlashCommandAttachmentOption()
        .setName("img")
        .setDescription("Adjunta una imagen al Embed")
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
    await interaction.deferReply();

    const { subgroup, subcommand } = params;
    const { CustomElements } = models;

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
                    if(!buttonObj.data.url) buttonObj.setCustomId(`BUTTON-${interaction.guild.id}-${bId}`);

                    row.addComponents(buttonObj);
                }
            }

            console.log(row)

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

    try {
        switch (subcommand) {
            case "create": {
                const newEmbed = new CustomEmbed(embeds)
                let confirmation = await Confirmation("Nuevo Embed", [
                    "El Embed se verá así:",
                    newEmbed
                ], interaction)

                if (!confirmation) return;
                return await newEmbed.save(interaction);
            }
            case "edit": {
                let { id } = embeds;

                return new CustomEmbed(embeds).replace(id.value, interaction)
            }
            case "del": {
                let { id } = embeds;

                return new CustomEmbed().delete(id.value, interaction);
            }
        }

    } catch (err) {
        if (err instanceof DiscordAPIError) {
            throw new DiscordLimitationError(interaction, "enviar Embed", [
                "No se podría enviar tu Embed",
                "Verifica que el Embed tenga sentido y pueda ser creado",
                codeBlock("js", err)
            ])
        }

        throw err;
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
            throw new DiscordLimitationError(interaction, "enviar Embed", [
                "No se podría enviar tu Botón",
                "Verifica que el Botón tenga sentido y pueda ser creado",
                codeBlock("js", err)
            ])
        }

        throw err;
    }
}

module.exports = command;