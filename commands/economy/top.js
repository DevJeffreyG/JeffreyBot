const { Command, Top } = require("../../src/utils")

const command = new Command({
    name: "top",
    desc: "Revisa los tops del servidor"
})

command.addSubcommand({
    name: "dinero",
    desc: "Revisa el top del dinero"
})

command.addSubcommand({
    name: "exp",
    desc: "Revisa el top de EXP y niveles"
})

command.addSubcommand({
    name: "rep",
    desc: "Revisa el top de puntos de reputación"
})

command.addSubcommand({
    name: "warns",
    desc: "Revisa el top de warns de todos los tiempos"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users } = models
    const { subcommand } = params

    // codigo
    const top = new Top(await Users.find({ guild_id: interaction.guild.id }), interaction, subcommand)
    return await top.init();
}

module.exports = command;