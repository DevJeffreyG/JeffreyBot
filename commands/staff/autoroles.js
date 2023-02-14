const { Command, Categories, Embed, ErrorEmbed, FindNewId, Confirmation } = require("../../src/utils")
const { Colores } = require("../../src/resources")
const { SnowflakeUtil, hyperlink } = require("discord.js")

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

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Guilds } = models
    const { subcommand } = params;
    const { canal, mensaje, server, emoji, role, autorole, toggle, nuevo } = params[subcommand];

    const doc = await Guilds.getOrCreate(interaction.guild.id);
    let config = await getConfig();

    switch (subcommand) {
        case "config":
            let ch, msg;

            if (!canal && !mensaje) {
                let e = new Embed()
                    .defAuthor({ text: `Configuración actual`, title: true })
                    .defDesc(`**— ${config.ch ?? "Sin definir"}\n— [Mensaje](${config.msg.url ?? "https://www.youtube.com/watch?v=iik25wqIuFo"})**`)
                    .defColor(Colores.verde);

                return interaction.editReply({ embeds: [e] });
            }

            const noch = new ErrorEmbed(interaction, {
                type: "errorFetch",
                data: {
                    type: "CHANNEL",
                    guide: `¡No está el canal definido! Asígnalo con este mismo comando.`
                }
            })

            if (canal) ch = canal.channel;
            else ch = interaction.guild.channels.cache.find(x => x.id === doc.settings.autoroles.channel_id);

            if (!ch) return noch.send();

            const nomsg = new ErrorEmbed(interaction, {
                type: "errorFetch",
                data: {
                    type: "MESSAGE ID",
                    guide: `El mensaje con ID \`${mensaje.value}\` NO existe en el canal ${ch}!`
                }
            })

            if (mensaje) {
                await ch.messages.fetch();
                msg = ch.messages.cache.find(x => x.id === mensaje.value);
                if (!msg) return nomsg.send();
            }

            let confirm = [];
            if (ch) confirm.push(`Cambiar el canal a ${ch}.`)
            if (msg) confirm.push(`Cambiar el mensaje a [este](${msg.url}).`)

            let confirmation = await Confirmation("Cambiar configuración", confirm, interaction);
            if (!confirmation) return;

            doc.settings.autoroles.channel_id = ch.id;
            doc.settings.autoroles.message_id = msg.id;

            if(server) {
                let guild = await interaction.client.guilds.fetch(server.value).catch(err => {return null});
                doc.settings.autoroles.guild_id = guild?.id;
            }

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
            let emote = emoji.value;
            let id = emote.match(/\d/g);
            let newId = FindNewId(await Guilds.find(), "data.autoroles", "id");

            if (id && id.length > SnowflakeUtil.generate().length - 5) emote = id;

            if(config.guild) emote = await config.guild.emojis.fetch(emoji.value).catch(err => {return null});

            if(!emote) return new ErrorEmbed(interaction, {
                type: "badParams",
                data: {
                    help: `No encontré ese emote en el servidor '${config.guild ?? interaction.guild}'`
                }
            }).send();

            let q = await doc.addAutoRole(emote, role.value, newId);

            const notadded = new ErrorEmbed(interaction, {
                type: "badParams",
                data: {
                    help: "No se pueden repetir emotes o roles por mensaje"
                }
            })

            if (!q) return notadded.send();

            await config.msg.react(emote);

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
            if (!autoRole) {
                let err = new ErrorEmbed(interaction, {
                    type: "doesntExist",
                    data: {
                        action: "remove autorole",
                        missing: `El AutoRole ID \`${autorole.value}\``,
                        context: "la base de datos"
                    }
                });

                return err.send();
            }

            let removeChannel = interaction.guild.channels.cache.find(x => x.id === autoRole.channel_id);
            let toRemoveFetch = await removeChannel.messages.fetch(autoRole.message_id);

            let toRemove = await toRemoveFetch.reactions.cache.get(autoRole.emote);

            let confirm = [
                `AutoRole con ID \`${autoRole.id}\`.`,
                `Se eliminarán \`${toRemove.count}\` reacciones, incluyendo la del bot.`,
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
            await toRemove.remove();

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

            // revisar que no haya autoroles con ese mismo toggle id en otro canal
            let error = new ErrorEmbed(interaction,
                {
                    type: "alreadyExists",
                    data: {
                        action: "toggle autorole",
                        existing: `AutoRole con Toggle Group ID \`${toggleGroupId}\``,
                        context: "otro canal y/o mensaje"
                    }
                })
            if (doc.data.autoroles.find(x => x.toggle_group === toggleGroupId && x.message_id != autoRole.message_id))
                return error.send();

            autoRole.toggle_group = toggleGroupId;
            await doc.save();

            return interaction.editReply({ content: `${client.Emojis.Check} AutoRole \`${autoRole.id}\` toggled para **${toggleGroup.group_name}**!\nPuedes cambiar el nombre del Toggle Group con \`/autoroles edit_toggle\``, embeds: [], components: [] });
        }

        case "edit_toggle": {
            const toggleGroupId = toggle.value;
            const toggleGroup = doc.getOrCreateToggleGroup(toggleGroupId);

            toggleGroup.group_name = nuevo.value;
            await doc.save();
            return interaction.editReply({ content: `${client.Emojis.Check} Toggle Group \`${toggleGroup.id}\` ➡️ **${toggleGroup.group_name}**!`, embeds: [], components: [] });
        }

        case "list": {
            let notExists = new ErrorEmbed(interaction, { type: "doesntExist", data: { action: "get autoroles", missing: "AutoRoles" } });
            const autoroles = doc.data.autoroles;
            if (autoroles.length == 0)
                return notExists.send();

            let listEmbed = new Embed()
                .defAuthor({ text: `Lista de autoroles`, icon: interaction.guild.iconURL() })
                .defColor(Colores.verde);

            for (let i = 0; i < autoroles.length; i++) {
                const autorole = autoroles[i];
                let emote = !isNaN(autorole.emote) ? interaction.guild.emojis.cache.find(x => x.id === autorole.emote) : autorole.emote;
                let grupo = autorole.toggle_group ? doc.getOrCreateToggleGroup(autorole.toggle_group) : "No tiene";
                let aRole = interaction.guild.roles.cache.find(x => x.id === autorole.role_id);
                let actualC = await interaction.guild.channels.fetch(autorole.channel_id);
                let actualFetch = await actualC.messages.fetch(autorole.message_id);

                console.log(actualC, actualFetch)

                listEmbed.defField(`— ${emote}`, `▸ **ID**: ${autorole.id}.\n▸ **Toggle Grupo**: ${grupo != "No tiene" ? grupo.group_name + ", **" + grupo.id + "**" : grupo}.\n▸ ${aRole}.\n▸ ${hyperlink("Mensaje", actualFetch?.url)}`)
            }

            return interaction.editReply({ embeds: [listEmbed] });
        }
    }

    async function getConfig() {
        let ch = interaction.guild.channels.cache.find(x => x.id === doc.settings.autoroles.channel_id);
        if (!ch) return { ch: null, msg: null }

        await ch.messages.fetch();
        let msg = ch.messages.cache.find(x => x.id === doc.settings.autoroles.message_id);

        let guild = await interaction.client.guilds.fetch(doc.settings.autoroles.guild_id) ?? null;

        return { ch, msg, guild };
    }
}

module.exports = command;
