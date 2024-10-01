const { Command, Top } = require("../../utils")

const command = new Command({
    name: "top",
    desc: "Revisa los tops del servidor"
})

command.addSubcommand({
    name: "dinero",
    desc: "Revisa el top del dinero usable"
})

command.addSubcommand({
    name: "patrimonios",
    desc: "Revisa el top de los patrimonios"
})

command.addSubcommand({
    name: "protegido",
    desc: "Revisa el top del dinero protegido"
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

    // codigo
    const top = new Top(await Users.find({ guild_id: interaction.guild.id }), interaction, params)
    return await top.init();
}

module.exports = command;