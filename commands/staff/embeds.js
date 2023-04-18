const { SlashCommandStringOption, SlashCommandBooleanOption, SlashCommandAttachmentOption, ButtonStyle, SlashCommandIntegerOption, DiscordAPIError } = require("discord.js");
const { Command, Categories, CustomEmbed, Confirmation, ErrorEmbed } = require("../../src/utils");

const command = new Command({
    name: "embeds",
    desc: "Todo lo que tenga que ver con la administración de Embeds dentro del servidor",
    category: Categories.Staff
})

command.data
    .addSubcommandGroup(basic => basic
        .setName("basic")
        .setDescription("Administración básica de los Embeds")
        .addSubcommand(create => create
            .setName("create")
            .setDescription("Crea un nuevo Embed")
        )
        .addSubcommand(edit => edit
            .setName("edit")
            .setDescription("Edita los Embeds ya creados")
        )
        .addSubcommand(list => list
            .setName("list")
            .setDescription("Revisa la lista de los Embeds creados")
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
        .addSubcommand(list => list
            .setName("list")
            .setDescription("Revisa la lista de los botones creados")
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

command.addOptionsTo(["basic edit", "buttons edit"], [
    new SlashCommandIntegerOption()
        .setName("id")
        .setDescription("La ID del elemento a editar")
        .setMinValue(1)
        .setRequired(true)
])

command.addOptionsTo(["basic create", "basic edit"], [
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
    new SlashCommandIntegerOption()
        .setName("embed-id")
        .setDescription("La ID del Embed que va a mostrar si este botón se pulsa")
        .setMinValue(1)
])

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { subgroup, subcommand } = params;
    const { CustomElements } = models;

    if (subcommand === "send") {
        let { id } = params[subcommand];

        let custom = await CustomElements.getOrCreate(interaction.guild.id);
        let dbEmbed = custom.getEmbed(id.value)
        let embed = new CustomEmbed(dbEmbed)

        await interaction.channel.send({ embeds: [embed] });
        return interaction.deleteReply();
    }

    switch (subgroup) {
        case "basic":
            return await command.execBasic(interaction, models, params, client);
    }
}

command.execBasic = async (interaction, models, params, client) => {
    const { subcommand, basic } = params;

    switch (subcommand) {
        case "create": {
            const newEmbed = new CustomEmbed(basic)

            try {
                let confirmation = await Confirmation("Crear Embed", [
                    "El Embed se verá así:",
                    newEmbed
                ], interaction)

                if (!confirmation) return;

                await newEmbed.save(interaction);
            } catch (err) {
                if (err instanceof DiscordAPIError) {
                    return new ErrorEmbed(interaction, {
                        type: "discordLimitation",
                        data: {
                            action: "create embed",
                            help: "Verifica que el Embed tenga sentido y pueda ser creado"
                        }
                    })
                        .defFooter({ text: err.message, icon: client.EmojisObject.Error.url })
                        .send();
                }

                throw err;
            }
            break;
        }
    }
}

module.exports = command;