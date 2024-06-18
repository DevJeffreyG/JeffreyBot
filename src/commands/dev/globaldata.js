const ms = require("ms");

const { Command, Embed, GlobalDatasWork, DarkShop } = require("../../utils")
const { Colores } = require("../../resources")

const command = new Command({
    name: "globaldata",
    desc: "Obtener información de globaldatas"
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
        .defField(`▸ temporalPoll`, `**—** Información de una encuesta del STAFF en un servidor.`)
        .defField(`▸ guildcommands`, `**—** Información de dónde están los SlashCommands para los Guilds (toggle entre el modo developer).`)
        .defField(`▸ clientActivities`, `**—** Lista de todas las actividades del cliente`)

    if (tipo?.value) {
        let q = await GlobalDatas.getAll(tipo.value);

        await interaction.editReply({ embeds: [new Embed({ type: "success", data: { title: "Revisa la consola" } })] })

        console.log("-- Consulta: '%s' --", tipo.value)
        return console.log(q)
    }

    if (!update) {
        return await interaction.editReply({ content: null, embeds: [embed] });
    } else {
        let ds = new DarkShop(interaction.guild, interaction);

        await GlobalDatasWork(interaction.guild);
        await ds.removeDarkCurrency();

        return interaction.editReply({ content: "Interval de global datas ejecutado." })
            .then(m => {
                setTimeout(() => {
                    m.delete().catch(err => {
                        console.error("🔴 %s", err);
                    });
                }, ms("10s"));
            }).catch(err => {
                console.error("🔴 %s", err);
            });;
    }
}

module.exports = command;