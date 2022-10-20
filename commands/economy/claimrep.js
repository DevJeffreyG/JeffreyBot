const { Command, Categories, RandomCumplido, Confirmation, Embed } = require("../../src/utils")

const command = new Command({
    name: "claimrep",
    desc: "Cambia todos los puntos de reputación que tengas por Jeffros (1000/rep)",
    category: Categories.Economy
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { Users } = models;
    const { Emojis } = client;

    const user = await Users.getOrCreate({user_id: interaction.user.id, guild_id: interaction.guild.id});

    let cool = user.cooldown("claim_rep", {save: false});
    if(cool) return interaction.editReply({content: `Usa este comando en ${cool}, ${RandomCumplido()}`});

    let value = user.economy.global.reputation * 1000;

    let toConfirm = [
        `Se añadirán **${Emojis.Jeffros}${value.toLocaleString("es-CO")}** a tu cuenta.`,
        `Sólo puedes usar este comando cada 3 horas.`
    ]

    let confirmation = await Confirmation("Reclamar reputación", toConfirm, interaction);
    if(!confirmation) return;

    await user.addJeffros(value)

    return confirmation.editReply({embeds: [new Embed({type: "success"})]})
}

module.exports = command