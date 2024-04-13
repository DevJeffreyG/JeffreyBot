const { Command, Embed } = require("../../src/utils");

const command = new Command({
    name: "moduleban",
    desc: "Banear a un usuario de cierto módulo para que no lo pueda usar"
})

command.addOption({
    type: "string",
    name: "modulo",
    desc: "El módulo en el que se baneará",
    choices: ["Tickets", "Sugerencias"],
    req: true
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario a banear del módulo",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { Users } = models;
    const { modulo, usuario } = params;

    const user = await Users.getWork({ user_id: usuario.value, guild_id: interaction.guild.id });

    switch (modulo.value) {
        case "sugerencias":
            action = await user.toggleBan("suggestions");
            break;

        case "tickets":
            action = await user.toggleBan("tickets");
            break;
    }

    const embed = new Embed({
        type: "success",
        data: {
            desc: `Se ha ${action ? "baneado" : "desbaneado"} del módulo "\`${modulo.value}\`"`
        }
    })

    return await interaction.editReply({ embeds: [embed] });
}

module.exports = command;