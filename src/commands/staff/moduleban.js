const { Command, Embed, Enum, ModuleBans } = require("../../utils");

const command = new Command({
    name: "moduleban",
    desc: "Banear a un usuario de cierto módulo para que no lo pueda usar"
})

command.addOption({
    type: "string",
    name: "modulo",
    desc: "El módulo en el que se baneará",
    choices: new Enum(ModuleBans).complexArray({valueString: true}),
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

    let action = await user.toggleBan(modulo.value);

    const embed = new Embed({
        type: "success",
        data: {
            desc: `Se ha ${action ? "baneado" : "desbaneado"} del módulo "\`${new Enum(ModuleBans).translate(modulo.value)}\`"`
        }
    })

    return await interaction.editReply({ embeds: [embed] });
}

module.exports = command;