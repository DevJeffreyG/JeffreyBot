const { Command, Embed } = require("../../src/utils")
const { Config, Colores } = require("../../src/resources")

const command = new Command({
    name: "actividad",
    desc: "Cambia la actividad del bot (temporalmente)",
    category: "DEV"
})

command.addOption({
    type: "string",
    name: "actividad",
    desc: "La nueva actividad del bot",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ephemeral: true});

    const { actividad } = params;
    const author = interaction.member;

    if(actividad.value == "default"){
        let guilds = await client.guilds.fetch();

        let totalMembers = 0;
        for(const key of guilds.keys()){
            let actualGuild = client.guilds.cache.find(x => x.id === key);
            actualGuild.members.fetch();

            totalMembers += actualGuild.memberCount;
        }

        actividad.value = `/ayuda - ${totalMembers} usuarios🔎`
    }

    let setgamembed = new Embed()
    .defColor(Colores.verde)
    .defAuthor({text: `Actividad actualizada`, icon: Config.bienPng})
    .defDesc(`${client.user.username} ahora juega \`${actividad.value}\`.`)
    .defFooter({text: `Puesto por ${author.user.tag}.`, icon: author.displayAvatarURL()});

    client.user.setActivity(actividad.value);
    console.log(`🔄 ${client.user.username} Ahora juega ${actividad.value}.`);
    interaction.editReply({embeds: [setgamembed]});
}

module.exports = command;