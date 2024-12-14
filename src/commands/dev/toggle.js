const { Colores } = require("../../resources");
const { Command, Embed, Enum, ToggleableFunctions } = require("../../utils");

const command = new Command({
    name: "toggle",
    desc: "Habilitar/Desactivar cosas del bot"
});

command.addSubcommand({
    name: "command",
    desc: "Habilita/desactiva algún comando del bot"
})


command.addSubcommand({
    name: "functions",
    desc: "Habilita/desactiva alguna de las funciones del bot"
})

command.addOption({
    type: "string",
    name: "comando",
    desc: "Comando a togglear",
    sub: "command",
    req: true
})

command.addOption({
    type: "string",
    name: "razon",
    desc: "¿Alguna razón en específico?",
    sub: "command"
})

command.addOption({
    type: "integer",
    name: "funcion",
    desc: "La función a togglear",
    choices: new Enum(ToggleableFunctions).complexArray(),
    sub: "functions",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { EmojisObject } = client
    const { subcommand } = params;

    let toggles = client.toggles;

    switch (subcommand) {
        case "command": {
            const { comando } = params[subcommand];

            const commandName = comando.value;
            const reason = params[subcommand].razon ? params[subcommand].razon.value : "Mantenimiento";

            let on = new Embed()
                .defAuthor({ text: "Habilitado", icon: EmojisObject.Check.url })
                .defDesc(`**—** Se ha habilitado el comando ${client.mentionCommand(commandName)}.`)
                .defColor(Colores.verde);

            let off = new Embed()
                .defAuthor({ text: "Deshabilitado", icon: EmojisObject.Check.url })
                .defDesc(`**—** Se ha deshabilitado el comando ${client.mentionCommand(commandName)}.`)
                .defColor(Colores.verde);

            if (toggles.info.commands.find(x => x.name === commandName)) {
                toggles.info.commands.splice(toggles.info.commands.findIndex(x => x.name === commandName), 1)
                toggles.markModified("info")
                
                await interaction.editReply({ embeds: [on] })
            } else {
                toggles.info.commands.push({
                    name: commandName,
                    reason,
                    since: new Date()
                })
                toggles.markModified("info")

                await interaction.editReply({ embeds: [off] })
            }

            return await toggles.save();
        }

        case "functions": {
            const { funcion } = params[subcommand];
            let functionEnumName = new Enum(ToggleableFunctions).translate(funcion.value);

            let on = new Embed()
                .defAuthor({ text: "Habilitado", icon: EmojisObject.Check.url })
                .defDesc(`**—** Se ha habilitado la función \`${functionEnumName}\`.`)
                .defColor(Colores.verde);

            let off = new Embed()
                .defAuthor({ text: "Deshabilitado", icon: EmojisObject.Check.url })
                .defDesc(`**—** Se ha deshabilitado la función \`${functionEnumName}\`.`)
                .defColor(Colores.verde);

            if (toggles.info.functions.find(x => x === funcion.value)) {
                toggles.info.functions.splice(toggles.info.functions.findIndex(x => x === funcion.value), 1)
                toggles.markModified("info")
                
                await interaction.editReply({ embeds: [on] })
            } else {
                toggles.info.functions.push(funcion.value)
                toggles.markModified("info")

                await interaction.editReply({ embeds: [off] })
            }

            return await toggles.save();
        }
    }
}

module.exports = command;