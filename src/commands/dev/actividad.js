const { Command, Embed, FindNewId, ActivityWork, InteractivePages } = require("../../utils")
const { Colores } = require("../../resources")

const command = new Command({
    name: "actividad",
    desc: "Administra la actividad del bot"
})

command.addSubcommand({
    name: "add",
    desc: "Crea una nueva actividad",
})

command.addSubcommand({
    name: "remove",
    desc: "Elimina una actividad de la lista",
})

command.addSubcommand({
    name: "list",
    desc: "Obtén la lista de las actividades actuales",
})

command.addSubcommand({
    name: "set",
    desc: "Establece de manera fija una actividad de la lista"
})

command.addSubcommand({
    name: "cycle",
    desc: "No hacer cambios pero iniciar el ActivityWork()"
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "La ID de la actividad en la lista existente, 0 para volverlo random de nuevo.",
    sub: "set",
    req: true
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "La ID de la actividad a eliminar",
    req: true,
    sub: "remove"
})

command.addOption({
    type: "string",
    name: "nueva",
    desc: "La nueva actividad a agregar",
    req: true,
    sub: "add"
})

command.addOption({
    type: "string",
    name: "tipo",
    desc: "El tipo de actividad",
    choices: ["Competing", "Listening", "Playing", "Watching"],
    req: false,
    sub: "add"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { GlobalDatas } = models;
    const { subcommand } = params;
    const { nueva, id, tipo } = params[subcommand];

    const activities = await GlobalDatas.getActivities();

    switch (subcommand) {
        case "add":
            activities.info.list.push({ value: nueva.value, type: tipo?.value, id: FindNewId([activities], "info.list", "id") })
            activities.markModified("info");
            break;

        case "remove":
            activities.info.list.splice(activities.info.list.findIndex(x => x.id === id.value), 1)
            if (activities.info.fixed === id.value) activities.info.fixed = null;
            activities.markModified("info");

            break;

        case "list":
            let items = new Map();

            for (const act of activities.info.list) {
                const { value } = act;
                let actId = act.id;

                items.set(actId, {
                    id: actId,
                    tipo: act.type ?? "playing",
                    value
                })
            }

            const interactive = new InteractivePages({
                title: "Lista de actividades",
                author_icon: interaction.guild.iconURL({dynamic: true}),
                color: Colores.verde,
                addon: `**{value}**\n▸ Tipo: {tipo}\n▸ ID: {id}\n\n`
            }, items, 3)

            return await interactive.init(interaction);

        case "set":
            let i = activities.info.list.find(x => x.id === id.value)
            if (i) {
                activities.info.fixed = id.value;
                activities.markModified("info");
            } else if (id.value === 0) {
                activities.info.fixed = null;
                activities.markModified("info");
            }
            else return await interaction.editReply({ content: "ESA ID NO EXISTE" });
            break;

        case "cycle":
            await ActivityWork(client);
            break;
    }

    await activities.save()
    return await interaction.editReply({ embeds: [new Embed({ type: "success" })] });
}

module.exports = command;