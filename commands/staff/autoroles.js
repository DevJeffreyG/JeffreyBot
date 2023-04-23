const { Command, Categories, Embed, FindNewId, Confirmation, InteractivePages } = require("../../src/utils")
const { Colores } = require("../../src/resources")
const { hyperlink, Collection, Emoji } = require("discord.js")
const { BadParamsError, DoesntExistsError, FetchError, InsuficientSetupError } = require("../../src/errors")

const command = new Command({
    name: "autoroles",
    desc: "Todo lo que tenga que ver con AutoRoles está aquí",
    category: Categories.Staff
})

command.data
    .addSubcommand(add =>
        add
            .setName("add")
            .setDescription("Agrega un nuevo autorole al mensaje con la config actual")
            .addStringOption(emoji =>
                emoji
                    .setName("emoji")
                    .setDescription("El emoji con el que se va a reacionar al mensaje")
                    .setRequired(true)
            )
            .addRoleOption(role =>
                role
                    .setName("role")
                    .setDescription("El role que se va a dar/quitar al reaccionar con el mensaje")
                    .setRequired(true)
            )
    )
    .addSubcommand(remove =>
        remove
            .setName("remove")
            .setDescription("Eliminas un AutoRole y consigo todas sus reacciones")
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
    .addSubcommand(config =>
        config
            .setName("config")
            .setDescription("La configuración del canal y el mensaje a donde se administrarán los autoroles")
            .addChannelOption(o =>
                o
                    .setName("canal")
                    .setDescription("El canal donde se encuentra el mensaje")
            )
            .addStringOption(o =>
                o
                    .setName("mensaje")
                    .setDescription("La id del mensaje donde se creará el autorole")
            )
            .addStringOption(o =>
                o
                    .setName("server")
                    .setDescription("La id del servidor donde está el emoji")
            )
    )
    .addSubcommand(list =>
        list
            .setName("list")
            .setDescription("Obtén una lista de los AutoRoles con sus grupos")
    )
    .addSubcommand(sync =>
        sync
            .setName("sync")
            .setDescription("Sincroniza las reacciones del servidor")
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Guilds } = models
    const { subcommand } = params;
    const { canal, mensaje, server, emoji, role, autorole, toggle, nuevo } = params[subcommand];

    const doc = params.getDoc();
    let config = await getConfig();

    switch (subcommand) {
        case "config":
            let ch, msg, guild;

            if (!canal && !mensaje && !server) {
                let e = new Embed()
                    .defAuthor({ text: `Configuración actual`, title: true })
                    .defDesc(`**— ${config.ch ?? "Sin definir"}\n— [Mensaje](${config.msg.url ?? "https://www.youtube.com/watch?v=iik25wqIuFo"})**`)
                    .defColor(Colores.verde);

                return interaction.editReply({ embeds: [e] });
            }

            if (canal) ch = canal.channel;
            else ch = interaction.guild.channels.cache.find(x => x.id === doc.settings.autoroles.channel_id);

            if (!ch)
                throw new FetchError(interaction, "canal", [
                    "No hay ningún canal configurado", `Usa ${client.mentionCommand("autoroles config")}`
                ])

            if (mensaje) {
                await ch.messages.fetch();
                msg = ch.messages.cache.find(x => x.id === mensaje.value);
                if (!msg)
                    throw new FetchError(interaction, "mensaje", [
                        `No se encontró el mensaje (\`${mensaje?.value ?? '0'}\`) en el canal ${ch}`,
                        `Usa ${client.mentionCommand("autoroles config")}`
                    ])

            } else msg = ch.messages.cache.find(x => x.id === doc.settings.autoroles.message_id);

            if (server) {
                guild = await interaction.client.guilds.fetch(server.value).catch(err => { return null });
                doc.settings.autoroles.guild_id = guild?.id;
            }

            let confirm = [];
            if (ch) confirm.push(`Cambiar el canal a ${ch}.`)
            if (msg) confirm.push(`Cambiar el mensaje a [este](${msg.url}).`)
            if (guild) confirm.push(`Cambiar el servidor a ${guild.name}`)

            let confirmation = await Confirmation("Cambiar configuración", confirm, interaction);
            if (!confirmation) return;

            doc.settings.autoroles.channel_id = ch.id;
            doc.settings.autoroles.message_id = msg.id;

            await doc.save();

            return interaction.editReply({
                content: null, embeds: [
                    new Embed({
                        type: "success",
                        desc: "Se cambió la configuración"
                    })
                ], components: []
            });

        case "add":
            if (!config.ch || !config.msg)
                throw new InsuficientSetupError(interaction, "canal y mensaje", [
                    "Falta configurar el canal y/o mensaje",
                    `Usa ${client.mentionCommand("autoroles config")}`
                ]);

            let id = emoji.value.match(/\d/g)?.join("");
            let newId = FindNewId(await Guilds.find(), "data.autoroles", "id");

            if (!id) id = config.guild.emojis.cache.find(x => x.name === emoji.value)?.id;

            let emote = id ? await config.guild.emojis.fetch(id).catch(err => { return null }) : { id: emoji.value, guild: null };
            let noemoji = false;

            try {
                emote instanceof Emoji ? await config.msg.react(emote) : await config.msg.react(emote.id);
            } catch (err) {
                console.log(err)
                noemoji = true;
            }

            if (emote instanceof Collection || noemoji)
                throw new BadParamsError(interaction, [
                    `No encontré el emote ${emote instanceof Emoji ? emote : emote.id} en el servidor '${config.guild ?? interaction.guild}'`,
                    `Usa ${client.mentionCommand("autoroles config")} para verificar tu configuración`
                ])

            let q = await doc.addAutoRole(emote, role.value, newId);
            if (!q) throw new BadParamsError(interaction, "No se pueden repetir emotes o roles por mensaje");

            return interaction.editReply({
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

            let toRemoveFetch, toRemove;

            let removeChannel = interaction.guild.channels.cache.find(x => x.id === autoRole.channel_id);
            if (removeChannel) toRemoveFetch = await removeChannel.messages.fetch(autoRole.message_id).catch(err => console.log(err)) ?? null;
            if (toRemoveFetch) toRemove = toRemoveFetch.reactions.cache.get(autoRole.emote) ?? null;

            let confirm = [
                `AutoRole con ID \`${autoRole.id}\`.`,
                `Se eliminarán \`${toRemove?.count ?? 0}\` reacciones, incluyendo la del bot.`,
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

            if (toRemove) await toRemove.remove();

            return interaction.editReply({
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

            return interaction.editReply({ content: `${client.Emojis.Check} AutoRole \`${autoRole.id}\` toggled para **${toggleGroup.group_name}**!\nPuedes cambiar el nombre del Toggle Group con ${client.mentionCommand("autoroles edit_toggle")}`, embeds: [], components: [] });
        }

        case "edit_toggle": {
            const toggleGroupId = toggle.value;
            const toggleGroup = doc.getOrCreateToggleGroup(toggleGroupId);

            toggleGroup.group_name = nuevo.value;
            await doc.save();
            return interaction.editReply({ content: `${client.Emojis.Check} Toggle Group \`${toggleGroup.id}\` ➡️ **${toggleGroup.group_name}**!`, embeds: [], components: [] });
        }

        case "list": {
            let items = new Map();

            for await (x of doc.data.autoroles) {
                let guildEmote = await interaction.client.guilds.fetch(x.guild_emote ?? interaction.guild.id).catch(err => null);
                let emote = !isNaN(x.emote) ? guildEmote.emojis.cache.get(x.emote) : x.emote;
                let grupo = x.toggle_group ? doc.getOrCreateToggleGroup(x.toggle_group) : "No tiene";
                let aRole = interaction.guild.roles.cache.get(x.role_id) ?? "Se eliminó el role";
                let actualC = interaction.guild.channels.cache.get(x.channel_id) ?? "Se eliminó";
                let actualFetch = await actualC?.messages?.fetch(x.message_id).catch(err => { console.log(err) }) ?? null;

                let mensaje = hyperlink("Mensaje", actualFetch?.url);

                items.set(x.id, {
                    emote,
                    id: x.id,
                    toggle: grupo,
                    role: aRole,
                    mensaje
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de AutoRoles",
                author_icon: interaction.guild.iconURL({ dynamic: true }),
                color: Colores.verde,
                addon: `**— {emote}**\n▸ **ID**: {id}.\n▸ **Toggle**: {toggle}.\n▸ {role}.\n▸ {mensaje}\n\n`
            }, items, 3)

            interactive.init(interaction);
            break;
        }

        case "sync": {
            let syncQuery = doc.data.autoroles;
            if (syncQuery?.length === 0) throw new DoesntExistsError(interaction, `AutoRoles`);

            for (let i = 0; i < syncQuery.length; i++) {
                const autorole = syncQuery[i];

                let channel = interaction.guild.channels.cache.find(x => x.id === autorole.channel_id);
                let fetched = await channel?.messages.fetch(autorole.message_id).catch(err => null);
                let emote = autorole.emote;

                if (fetched) fetched.react(emote);
            }

            interaction.editReply({ embeds: [new Embed({ type: "success" })] });
            break;
        }
    }

    async function getConfig() {
        let ch = interaction.guild.channels.cache.find(x => x.id === doc.settings.autoroles.channel_id);
        if (!ch) return { ch: null, msg: null, guild: interaction.guild }

        await ch.messages.fetch();
        let msg = ch.messages.cache.find(x => x.id === doc.settings.autoroles.message_id);

        let guild = await interaction.client.guilds.fetch(doc.settings.autoroles.guild_id).catch(err => { });

        if (guild instanceof Collection || !guild) {
            guild = interaction.guild
        }

        return { ch, msg, guild };
    }
}

module.exports = command;
