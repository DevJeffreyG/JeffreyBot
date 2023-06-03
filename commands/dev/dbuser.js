const { codeBlock } = require("discord.js");
const { Command, Categories } = require("../../src/utils")

const command = new Command({
    name: "dbuser",
    desc: "Busca la información que tiene Jeffrey Bot de un usuario en la base de datos"
});

command.addOption({
    type: "user",
    name: "miembro",
    desc: "Miembro a consultar",
    req: true
})

command.addOption({
    type: "string",
    name: "consulta",
    desc: "Consulta?"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { miembro, consulta } = params
    const { Users } = models

    let query = await Users.getWork({ user_id: miembro.value, guild_id: miembro.member.guild.id })
    const q = consulta && consulta.value ? consulta.value.split(".") : null;

    if (q && q.length >= 1) {
        for (let i = 0; i < q.length; i++) {
            const queryQ = q[i];

            query = query[queryQ]
        }
    }

    interaction.editReply({ content: `**${miembro.user.tag}**\n${codeBlock("json", query)}` });
}

module.exports = command;