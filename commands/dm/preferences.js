const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Colores } = require("../../src/resources");
const { Command, Embed } = require("../../src/utils");

const command = new Command({
    name: "preferencias",
    desc: "Cambia cómo se comporta Jeffrey Bot para ti"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.reply({
        embeds: [
            new Embed()
                .defTitle(`Preferencias de ${interaction.user.username}`)
                .defColor(Colores.verdejeffrey)
                .defDesc("Usa los botones para entrar en la configuración que deseas cambiar")
        ],
        components: [
            new ActionRowBuilder().setComponents(
                new ButtonBuilder()
                    .setCustomId(`preferences-${interaction.user.id}-dm`)
                    .setLabel("Mensajes Directos")
                    .setStyle(ButtonStyle.Primary)
            )
        ]
    })


}

module.exports = command;