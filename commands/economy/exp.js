const { Command, Categories, Confirmation, ErrorEmbed, Embed } = require("../../src/utils");
const command = new Command({
    name: "exp",
    desc: "Transforma tus Jeffros en experiencia para tu perfil cada semana",
    category: Categories.Economy
})

command.addOption({
    type: "integer",
    name: "jeffros",
    desc: "Los Jeffros que quieras cambiar a EXP",
    min: 1,
    max: 20000,
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { Users } = models;
    const { jeffros } = params;

    const user = await Users.getOrCreate({
        user_id: interaction.user.id,
        guild_id: interaction.guild.id
    });

    if(!user.canBuy(jeffros.value)) return new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "jeffros to exp",
            error: "No tienes tantos Jeffros.",
            money: user.economy.global.jeffros,
            darkshop: false
        }
    }).send()

    let cool = user.cooldown("jeffros_to_exp", {save: false});
    if(cool) return interaction.editReply({embeds: [new Embed({type: "cooldown", data: {cool}})]});

    let confirmation = await Confirmation("Cambiar Jeffros", [
        `¿Cambiar **${client.Emojis.Jeffros}${jeffros.value.toLocaleString("es-CO")}** a EXP?`,
        "Esta acción NO se puede deshacer.",
        "Sólo puedes usar este comando una vez por semana."
    ], interaction)
    if(!confirmation) return;

    user.economy.global.jeffros -= jeffros.value;
    user.economy.global.exp += jeffros.value;

    await user.save();
    return interaction.editReply({embeds: [new Embed({type: "success"})]});
}

module.exports = command;