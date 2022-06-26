const ms = require("ms");

const { Command, Embed, intervalGlobalDatas } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "globaldata",
    desc: "Obtener información de globaldatas",
    category: "DEV"
})

command.addOption({
    type: "boolean",
    name: "actualizar",
    desc: "Forzar intervalo de globaldatas?"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { actualizar } = params;
    let update = actualizar && actualizar.value ? actualizar.value : false;

    // Comando
    let embed = new Embed()
    .defAuthor({text: `Ayuda: /globaldata`, title: true })
    .defColor(Colores.verdeclaro)
    .defField(`▸ temporalGuildBan`, `**—** Información de un TempBan en el servidor.`)
    .defField(`▸ temporalPoll`, `**—** Información de una encuesta en el servidor.`)
    .defField(`▸ guildcommands`, `**—** Información de dónde están los SlashCommands para los Guilds (toggle entre el modo developer).`)
    
    if(!update){
        return interaction.editReply({content: null, embeds: [embed]});
    } else {
        await intervalGlobalDatas(client);

        return interaction.editReply({content: "Interval de global datas ejecutado."})
        .then(m => {
            setTimeout(() => {
                m.delete()
            }, ms("10s"));
        });
    }
}

module.exports = command;