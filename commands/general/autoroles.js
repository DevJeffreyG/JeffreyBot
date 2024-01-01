const { DoesntExistsError } = require("../../src/errors");
const AutoRole = require("../../src/handlers/AutoRole");
const { Colores } = require("../../src/resources");
const { Command, InteractivePages } = require("../../src/utils");

const command = new Command({
    name: "autoroles",
    desc: "Usa los autoroles de este servidor"
});

command.addOption({
    type: "integer",
    name: "id",
    desc: "La ID del AutoRole que te quieras agregar/eliminar"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });

    const { id } = params;

    const doc = params.getDoc();
    const autoroles = doc.data.autoroles;

    if (id) return command.work(interaction, models, params, client);

    let items = new Map();

    for (const autorole of autoroles) {
        let name = autorole.name;
        let role = interaction.guild.roles.cache.get(autorole.role_id) ?? "...";
        let req = interaction.guild.roles.cache.get(autorole.req_id) ?? "Nada";
        let id = autorole.id;

        items.set(id, {
            name,
            role,
            req,
            id
        })
    }

    const interactive = new InteractivePages({
        title: `AutoRoles de ${interaction.guild.name}`,
        footer: `Usa estas IDs para obtenerlos | Página {ACTUAL} de {TOTAL}`,
        color: Colores.verdeclaro,
        thumbnail: interaction.guild.iconURL(),
        description: ``,
        addon: `**— {name}**
**▸ Role**: {role}
**▸ Role requerido**: {req}
**▸ ID**: \`{id}\`\n\n`
    }, items, 3);

    return await interactive.init(interaction);
}

command.work = async (interaction, models, params, client) => {
    const id = params.id.value;

    const doc = params.getDoc();
    const autorole = doc.getAutoRole(id);
    if (!autorole)
        throw new DoesntExistsError(interaction, `AutoRole con ID \`${id}\``, "la base de datos");

    await new AutoRole(interaction)
        .setDoc(doc)
        .work([String(id)]);
}

module.exports = command;