const ms = require("ms");

const { Command, Embed, GlobalDatasWork, DarkShop } = require("../../utils")
const { Colores } = require("../../resources");
const { codeBlock } = require("discord.js");

const command = new Command({
    name: "globaldata",
    desc: "Obtener información de globaldatas"
})

command.addOption({
    type: "string",
    name: "tipo",
    desc: "Consulta los documentos con este tipo"
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
        .defField(`▸ temporalGuildBan`, `**—** Información de TempBans los servidores`)
        .defField(`▸ temporalPoll`, `**—** Información de encuestas del STAFF en los servidores.`)
        .defField(`▸ temproledeletion`, `**—** Información de los roles que fueron eliminados temporalmente.`)
        .defField(`▸ guildcommands`, `**—** Información de dónde están los SlashCommands para los Guilds (toggle entre el modo developer).`)
        .defField(`▸ clientActivities`, `**—** Lista de todas las actividades del cliente.`)
        .defField(`▸ toggles`, `**—** Información de cosas toggleadas.`)

    if (tipo?.value) {
        let q = await GlobalDatas.getAll(tipo.value);

        try {
            await interaction.editReply({ embeds: [new Embed({ type: "success", data: { title: "Query", desc: codeBlock("json", JSON.stringify(q)) } })] })
        } catch (err) {
            await interaction.editReply({ embeds: [new Embed({ type: "success", data: { title: "Revisa la consola" } })] }).catch(err => {
                console.error("🔴 %s", err);
            });
            console.error("🔴 %s", err);
        }

        console.log("-- Consulta: '%s' --", tipo.value)
        console.log(JSON.stringify(q))
        return;
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