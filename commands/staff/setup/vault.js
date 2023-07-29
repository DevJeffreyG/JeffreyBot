const { AlreadyExistsError, DoesntExistsError } = require("../../../src/errors");
const { Colores } = require("../../../src/resources");
const { Command, Confirmation, InteractivePages, PrettyCurrency } = require("../../../src/utils");

const command = new Command({
    name: "admin-vault",
    desc: "Administración del Vault del servidor"
})

command.data
    .addSubcommand(add =>
        add
            .setName("add")
            .setDescription("Agregar un nuevo código al Vault")
            .addStringOption(o =>
                o
                    .setName("codigo")
                    .setDescription("El código que se escribirá para recibir la recompensa")
                    .setRequired(true)
            )
    )
    .addSubcommand(remove =>
        remove
            .setName("remove")
            .setDescription("Elimina un código del Vault")
            .addIntegerOption(o =>
                o
                    .setName("codigo")
                    .setDescription("La ID del código a eliminar")
                    .setRequired(true)
            )
    )
    .addSubcommand(config =>
        config
            .setName("config")
            .setDescription("Configura/administra algún código ya creado")
            .addIntegerOption(o =>
                o
                    .setName("codigo")
                    .setDescription("La ID del código a configurar")
                    .setRequired(true)
            )
            .addStringOption(o =>
                o
                    .setName("pista")
                    .setDescription("Una pista nueva a agregar")
            )
            .addIntegerOption(o =>
                o
                    .setName("recompensa")
                    .setDescription("La nueva cantidad de dinero a dar como recompensa")
            )
    )
    .addSubcommand(list =>
        list
            .setName("list")
            .setDescription("Obtén una lista de todos los códigos dentro del servidor")
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { Guilds } = models;
    const { subcommand } = params;
    const { codigo, pista, recompensa } = params[subcommand];
    const { Currency } = client.getCustomEmojis(interaction.guild.id)

    const doc = params.getDoc();

    switch (subcommand) {
        case "add": {
            const id = FindNewId(await Guilds.find(), "data.vault_codes", "id");
            const code = codigo.value.toUpperCase();

            if (doc.getVaultCode(code))
                throw new AlreadyExistsError(interaction, code, "el Vault de este servidor");

            doc.data.vault_codes.push({
                code,
                id
            });
            await doc.save();

            let e = new Embed({
                type: "success",
                data: {
                    //separator: "**—**",
                    title: "Nuevos textos",
                    desc: [
                        `Código: \`${code}\``,
                        `Recompensa: **${Currency}100**`,
                        `ID de Código: \`${id}\``
                    ]
                }
            })
            return interaction.editReply({ content: null, embeds: [e] })
        }

        case "remove": {
            const id = codigo.value;
            const vaultCode = doc.getVaultCodeById(id);
            if (!vaultCode) throw new DoesntExistsError(interaction, `El código con ID \`${id}\``, "el Vault de este servidor");

            let confirm = [
                `Código con ID \`${vaultCode.id}\` : "**${vaultCode.code}**".`,
                `Tiene \`${vaultCode.hints.length}\` pistas adjuntas.`,
                `Da de recompensa ${PrettyCurrency(interaction.guild, vaultCode.reward)}`,
                `Esto no se puede deshacer.`
            ]

            let confirmation = await Confirmation("Eliminar código", confirm, interaction)
            if (!confirmation) return;

            let index = doc.data.vault_codes.indexOf(vaultCode);
            doc.data.vault_codes.splice(index, 1);
            await doc.save();

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: "Se ha eliminado el código del Vault"
                        }
                    })
                ], components: []
            });
        }

        case "config": {
            const vaultCode = doc.getVaultCodeById(codigo.value);

            if (!pista && !recompensa) { // config del codigo actual
                let e = new Embed()
                    .defAuthor({ text: `Configuración de ${vaultCode.code}`, title: true })
                    .defDesc(`**—** Recompensa de ${PrettyCurrency(interaction.guild, vaultCode.reward)}
**—** Tiene \`${vaultCode.hints.length}\` pistas en total.
**—** ID: \`${vaultCode.id}\`.`)
                    .defColor(Colores.verde);

                return interaction.editReply({ embeds: [e] })
            }

            if (pista) {
                const hint = pista.value;

                let toConfirm = [
                    `¿Deseas agregar la pista N°${vaultCode.hints.length + 1}?`,
                    `\`${hint}\`.`,
                    `Para el código "${vaultCode.code}" con ID \`${vaultCode.id}\``
                ]

                let confirmation = await Confirmation("Nueva pista", toConfirm, interaction);
                if (!confirmation) return;

                vaultCode.hints.push(hint);
            }

            if (recompensa) {
                const reward = recompensa.value;

                vaultCode.reward = reward;
            }

            await doc.save();

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: "Se ha actualizado el código"
                        }
                    })
                ]
            })
        }

        case "list": {
            let items = new Map();
            for (const vault of doc.data.vault_codes) {
                items.set(vault.id, {
                    code: vault.code,
                    reward: PrettyCurrency(interaction.guild, vault.reward),
                    hints: vault.hints.join("; "),
                    id: vault.id
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de códigos",
                color: Colores.verde,
                addon: `**— {code}**\n**Premio: {reward}**\n**Pistas:** \`\`\`{hints}\`\`\`\n**ID:** {id}\n\n`
            }, items, 3)

            return interactive.init(interaction);
        }
    }
}

module.exports = command;