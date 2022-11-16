const ms = require("ms");

const { Command, Categories, Embed, GlobalDatasWork } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "globaldata",
    desc: "Obtener información de globaldatas",
    category: Categories.Developer
})

command.addOption({
    type: "string",
    name: "tipo",
    desc: "Consulta los documentos con este tipo [ CONSOLA ]"
})

command.addOption({
    type: "boolean",
    name: "actualizar",
    desc: "Forzar intervalo de globaldatas?"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { actualizar, tipo } = params;
    const { GlobalDatas } = models;
    let update = actualizar?.value;

    // Comando
    let embed = new Embed()
        .defAuthor({ text: `Ayuda: /globaldata`, title: true })
        .defColor(Colores.verdeclaro)
        .defField(`▸ temporalGuildBan`, `**—** Información de un TempBan en el servidor.`)
        .defField(`▸ temporalPoll`, `**—** Información de una encuesta en el servidor.`)
        .defField(`▸ guildcommands`, `**—** Información de dónde están los SlashCommands para los Guilds (toggle entre el modo developer).`)
        .defField(`▸ rouletteItem`, `**—** Un item que puede salir en la ruleta`)

    if (tipo?.value) {
        let q = await GlobalDatas.find({
            "info.type": tipo.value
        });

        interaction.editReply({ embeds: [new Embed({ type: "success", data: { title: "Revisa la consola" } })] })

        console.log("-- Consulta: '%s' --", tipo.value)
        return console.log(q)
    }

    if (!update) {
        return interaction.editReply({ content: null, embeds: [embed] });
    } else {
        await GlobalDatasWork(interaction.guild);

        return interaction.editReply({ content: "Interval de global datas ejecutado." })
            .then(m => {
                setTimeout(() => {
                    m.delete()
                }, ms("10s"));
            });
    }
}

module.exports = command;