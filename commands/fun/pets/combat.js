const { BadParamsError, AlreadyUsingError } = require("../../../src/errors");
const { Command, PetCombat, Confirmation } = require("../../../src/utils");

const command = new Command({
    name: "combat",
    desc: "Entra en combate con tu mascota"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario al que vas a retar",
    req: true
})

command.addOption({
    type: "integer",
    name: "apuesta",
    desc: "Apostar por el combate"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users } = models;
    const { usuario, apuesta } = params
    const { Currency } = client.getCustomEmojis(interaction.guild.id)

    if (interaction.user === usuario.user) throw new BadParamsError(interaction, "No puedes retarte a ti mismo");
    let player1 = client.petCombats.get(interaction.user.id);
    let player2 = client.petCombats.get(usuario.value);

    if(player1) throw new AlreadyUsingError(interaction, `${player1.user.toString()} ya está en un combate`);
    if(player2) throw new AlreadyUsingError(interaction, `${player2.user.toString()} ya está en un combate`);
    
    const combat = await new PetCombat(interaction)
        .build(params.getDoc(), params.getUser(), await Users.getWork({ user_id: usuario.value, guild_id: interaction.guild.id }));

    let hostConfirmation = await Confirmation("Retar", [
        `¿Quieres retar a ${usuario.user} a un combate?`,
        `Tendrán que aceptarlo también.`
    ], interaction);
    if (!hostConfirmation) return;

    await interaction.editReply({ content: usuario.user.toString() })
    await interaction.followUp({ content: usuario.user.toString() }).then(m => m.delete());

    let rivalConfirmation = await Confirmation("Combatir", [
        `¿Quieres combatir contra ${interaction.user}?`,
        apuesta ? `Hay una apuesta de **${Currency}${apuesta.value.toLocaleString("es-CO")}**` : "No hay apuesta."
    ], interaction, usuario.user)
    if (!rivalConfirmation) return;

    await combat.changePet(interaction.user);
    await combat.changePet(usuario.user)

    return await combat.start(apuesta?.value);
}

module.exports = command;