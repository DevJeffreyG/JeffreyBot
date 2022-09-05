const { Config, Colores } = require("../../src/resources");
const { Command, Categories, Embed } = require("../../src/utils");

const command = new Command({
    name: "toggle",
    desc: "Habilita o deshabilita un comando del bot",
    category: Categories.Developer
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
    
    const { ToggledCommands } = models;
    const { comando } = params;
    const toggled = comando.value;
    const reason = params.razon ? params.razon.value : "Mantenimiento";
    
    let removed = new Embed()
    .defAuthor({text: "Eliminado", icon: Config.bienPng})
    .defDesc(`**—** Se ha eliminado el comando \`/${toggled}\`.`)
    .defColor(Colores.verde);
    
    let added = new Embed()
    .defAuthor({text: "Toggled", icon: Config.bienPng})
    .defDesc(`**—** Se ha agregado el comando \`/${toggled}\`.`)
    .defColor(Colores.verde);

    // Comando
    ToggledCommands.findOne({
        command: toggled
    }, (err, toggle) => {
        if(err) throw err;

        if(!toggle){
            new ToggledCommands({
                command: toggled,
                reason: reason
            }).save();

            return interaction.editReply({embeds: [added]})
        } else {
            toggle.remove();

            return interaction.editReply({embeds: [removed]})
        }
    })
}

module.exports = command;