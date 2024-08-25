const { Colores } = require("../../resources");
const { Command, Embed } = require("../../utils");

const command = new Command({
    name: "toggle",
    desc: "Habilita o deshabilita un comando del bot"
});

command.addOption({
    type: "string",
    name: "comando",
    desc: "Comando a togglear",
    req: true
})

command.addOption({
    type: "string",
    name: "razon",
    desc: "Alguna razón en específico?"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { EmojisObject } = client
    const { ToggledCommands } = models;
    const { comando } = params;
    const toggled = comando.value;
    const reason = params.razon ? params.razon.value : "Mantenimiento";

    let removed = new Embed()
        .defAuthor({ text: "Eliminado", icon: EmojisObject.Check.url })
        .defDesc(`**—** Se ha eliminado el comando ${client.mentionCommand(toggled)}.`)
        .defColor(Colores.verde);

    let added = new Embed()
        .defAuthor({ text: "Toggled", icon: EmojisObject.Check.url })
        .defDesc(`**—** Se ha agregado el comando ${client.mentionCommand(toggled)}.`)
        .defColor(Colores.verde);

    // Comando
    let toggle = await ToggledCommands.findOne({
        command: toggled
    });

    if (!toggle) {
        new ToggledCommands({
            command: toggled,
            reason: reason
        }).save();

        return await interaction.editReply({ embeds: [added] })
    } else {
        toggle.deleteOne();

        return await interaction.editReply({ embeds: [removed] })
    }
}

module.exports = command;