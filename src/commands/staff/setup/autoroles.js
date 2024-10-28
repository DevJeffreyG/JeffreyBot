const { Command, Embed, FindNewId, Confirmation, InteractivePages, FetchThisGuild, CustomButton } = require("../../../utils")
const { Colores } = require("../../../resources")
const { Emoji } = require("discord.js")
const { DoesntExistsError } = require("../../../errors")

const command = new Command({
    name: "admin-autoroles",
    desc: "Todo lo que tenga que ver con AutoRoles está aquí"
})

command.data
    .addSubcommand(add =>
        add
            .setName("add")
            .setDescription("Crea un nuevo AutoRole")
            .addRoleOption(role =>
                role
                    .setName("role")
                    .setDescription("El role que se va a dar/quitar al usar el AutoRole")
                    .setRequired(true)
            )

            .addStringOption(nombre =>
                nombre
                    .setName("nombre")
                    .setDescription("El texto que aparecerá en el botón")
                    .setRequired(true)
            )
            .addRoleOption(role =>
                role
                    .setName("req")
                    .setDescription("El role que se requiere para poder agregarse/quitarse el 'role'")
            )
            .addStringOption(emoji =>
                emoji
                    .setName("emoji")
                    .setDescription("El emoji que aparecerá junto al botón")
            )
            .addStringOption(o =>
                o
                    .setName("server")
                    .setDescription("La id del servidor donde está el emoji")
            )
    )
    .addSubcommand(remove =>
        remove
            .setName("remove")
            .setDescription("Elimina un AutoRole")
            .addIntegerOption(o =>
                o
                    .setName("autorole")
                    .setDescription("La ID del AutoRole a eliminar")
                    .setRequired(true)
            )
    )
    .addSubcommand(edittoggle =>
        edittoggle
            .setName("edit_toggle")
            .setDescription("Para editar toggle groups")
            .addIntegerOption(o =>
                o
                    .setName("toggle")
                    .setDescription("La ID del toggle group a editar")
                    .setRequired(true)
            )
            .addStringOption(o =>
                o
                    .setName("nuevo")
                    .setDescription("El nuevo nombre para este toggle group")
                    .setRequired(true)
            )
    )
    .addSubcommand(toggle =>
        toggle
            .setName("toggle")
            .setDescription("Vuelve un autorole a tipo toggle o quítalo")
            .addIntegerOption(o =>
                o
                    .setName("autorole")
                    .setDescription("La ID del autorole")
                    .setRequired(true)
            )
            .addIntegerOption(o =>
                o
                    .setName("toggle")
                    .setDescription("La ID del toggle group al que se va a agregar/eliminar el autorole")
                    .setRequired(true)
            )
    )
    .addSubcommand(list =>
        list
            .setName("list")
            .setDescription("Obtén una lista de los AutoRoles con sus grupos")
    )
    .addSubcommand(link =>
        link
            .setName("link")
            .setDescription("Vincula este AutoRole a un Embed creado (/elements)")
            .addIntegerOption(o =>
                o
                    .setName("autorole")
                    .setDescription("La ID del autorole")
                    .setRequired(true)
            )
            .addIntegerOption(o =>
                o
                    .setName("embed")
                    .setDescription("La ID del Embed")
                    .setRequired(true)
            )
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Guilds } = models
    const { subcommand } = params;
    const { embed, server, nombre, emoji, role, req, autorole, toggle, nuevo } = params[subcommand];

    if (server && !client.isThisFetched(server.value)) await FetchThisGuild(client, server.value);

    const doc = params.getDoc();

    switch (subcommand) {
        case "add":
            let guild = interaction.client.guilds.cache.get(server?.value) ?? interaction.guild;
            let newId = FindNewId(await Guilds.find(), "data.autoroles", "id");

            let id, emote, noemoji;
            id = emote = noemoji = null;

            if (emoji) {
                id = emoji.value.match(/\d/g)?.join("");

                if (!id && guild) id = guild.emojis.cache.find(x => x.name === emoji.value)?.id;

                emote = id ? guild.emojis.cache.get(id) : { id: emoji.value, guild: null };
                noemoji = false;

                //console.log(guild, emote);

                try {
                    emote instanceof Emoji ? await interaction.message.react(emote) : await interaction.message.react(emote.id);
                } catch (err) {
                    console.error("🔴 %s", err);
                    noemoji = true;
                }
            }

            //console.log(guild, emote);

            await doc.addAutoRole(nombre.value, role.value, req?.value, emote, newId);

            return await interaction.editReply({
                content: null, embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: ["Se creó el AutoRole", `ID: \`${newId}\``]
                        }
                    })
                ], components: []
            });

        case "remove": {
            const autoRole = doc.getAutoRole(autorole.value)
            if (!autoRole) throw new DoesntExistsError(interaction, `El AutoRole ID \`${autorole.value}\``, "este servidor")

            let confirm = [
                `AutoRole con ID \`${autoRole.id}\`.`,
                `**NO** se desvinculará de cualquier Elemento Embed creado. Usa ${client.mentionCommand("autoroles link")} para eso.`
                `Esto no se puede deshacer.`
            ]
            let toggletxt = `Toggle Group: **${doc.getOrCreateToggleGroup(autoRole.toggle_group).group_name}**, ID: \`${autoRole.toggle_group}\`.`
            if (autoRole.toggle_group)
                confirm.splice(1, 0, toggletxt) // agregarlo en la segunda posicion
            let confirmation = await Confirmation("Eliminar AutoRole", confirm, interaction)
            if (!confirmation) return;

            let index = doc.data.autoroles.indexOf(autoRole);
            doc.data.autoroles.splice(index, 1);
            await doc.save();

            return await interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: "Se ha eliminado el AutoRole"
                        }
                    })
                ], components: []
            });

        }

        case "toggle": {
            const autoroleId = autorole.value;
            const toggleGroupId = toggle.value;

            const toggleGroup = doc.getOrCreateToggleGroup(toggleGroupId)
            const autoRole = doc.getAutoRole(autoroleId)

            if (!autoRole) throw new DoesntExistsError(interaction, `El AutoRole ID \`${autoroleId}\``, "este servidor")

            autoRole.toggle_group = toggleGroupId;
            await doc.save();

            return await interaction.editReply({ content: `${client.Emojis.Check} AutoRole \`${autoRole.id}\` toggled para **${toggleGroup.group_name}**!\nPuedes cambiar el nombre del Toggle Group con ${client.mentionCommand("autoroles edit_toggle")}`, embeds: [], components: [] });
        }

        case "edit_toggle": {
            const toggleGroupId = toggle.value;
            const toggleGroup = doc.getOrCreateToggleGroup(toggleGroupId);

            toggleGroup.group_name = nuevo.value;
            await doc.save();
            return await interaction.editReply({ content: `${client.Emojis.Check} Toggle Group \`${toggleGroup.id}\` ➡️ **${toggleGroup.group_name}**!`, embeds: [], components: [] });
        }

        case "list": {
            let items = new Map();

            for await (x of doc.data.autoroles) {
                let guildEmote = await interaction.client.guilds.fetch(x.guild_emote ?? interaction.guild.id).catch(err => null);
                let emote = (!isNaN(x.emote) ? guildEmote.emojis.cache.get(x.emote) : x.emote) ?? "No tiene";

                let toggleGroup = x.toggle_group ? doc.getOrCreateToggleGroup(x.toggle_group) : null;
                let grupo = x.toggle_group ? `${toggleGroup.group_name} (\`${toggleGroup.id}\`)` : "No tiene";

                let aRole = interaction.guild.roles.cache.get(x.role_id) ?? "Se eliminó el role";
                let nombre = x.name;

                items.set(x.id, {
                    nombre,
                    emote,
                    id: x.id,
                    toggle: grupo,
                    role: aRole
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de AutoRoles",
                author_icon: interaction.guild.iconURL(),
                color: Colores.verde,
                addon: `**— {nombre}**\n▸ **ID**: {id}.\n▸ **Toggle**: {toggle}.\n▸ {role}.\n▸ **Emote**: {emote}.\n\n`
            }, items, 3)

            await interactive.init(interaction);
            break;
        }

        case "link": {
            await new CustomButton(interaction).linkWork(autorole.value, embed.value, true);
            break;
        }
    }
}

module.exports = command;
