const { Command, Categories, Top } = require("../../src/utils")

const command = new Command({
    name: "top",
    desc: "Revisa los tops del servidor",
    category: Categories.Economy
})

command.addSubcommand({
    name: "jeffros",
    desc: "Revisa el top de Jeffros"
})

command.addSubcommand({
    name: "exp",
    desc: "Revisa el top de EXP y niveles"
})

command.addSubcommand({
    name: "rep",
    desc: "Revisa el top de reputación de todos los tiempos"
})

command.addSubcommand({
    name: "warns",
    desc: "Revisa el top de warns de todos los tiempos"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users, Shops } = models
    const { subcommand } = params

    // codigo
    const top = new Top(await Users.find({guild_id: interaction.guild.id}), interaction, subcommand)
    return top.init();
}

module.exports = command;