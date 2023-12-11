const { BadParamsError, AlreadyUsingError, EconomyError } = require("../../../src/errors");
const { Command, PetCombat, Confirmation, PrettyCurrency } = require("../../../src/utils");

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
    min: 1,
    desc: "Apostar por el combate"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users } = models;
    const { usuario, apuesta } = params;

    if (interaction.user === usuario.user) throw new BadParamsError(interaction, "No puedes retarte a ti mismo");
    let player1 = client.petCombats.get(interaction.user.id);
    let player2 = client.petCombats.get(usuario.value);

    if (player1) throw new AlreadyUsingError(interaction, `${player1.user.toString()} ya está en un combate`);
    if (player2) throw new AlreadyUsingError(interaction, `${player2.user.toString()} ya está en un combate`);

    const combat = await new PetCombat(interaction)
        .build(params.getDoc(), params.getUser(), await Users.getWork({ user_id: usuario.value, guild_id: interaction.guild.id }));

    let hostConfirmation = await Confirmation("Retar", [
        `¿Quieres retar a ${usuario.user} a un combate?`,
        `Tendrán que aceptarlo también.`
    ], interaction);
    if (!hostConfirmation) return;

    if (apuesta && !combat.userDoc.affords(apuesta.value)) throw new EconomyError(interaction, "No tienes tanto dinero", combat.userDoc.getCurrency());

    await interaction.editReply({ content: usuario.user.toString() })
    await interaction.followUp({ content: usuario.user.toString() }).then(m => m.delete());

    let rivalConfirmation = await Confirmation("Combatir", [
        `¿Quieres combatir contra ${interaction.user}?`,
        apuesta ? `Hay una apuesta de ${PrettyCurrency(interaction.guild, apuesta.value)}` : "No hay apuesta."
    ], interaction, usuario.user)
    if (!rivalConfirmation) return;
    if (apuesta && !combat.rivalDoc.affords(apuesta.value)) throw new EconomyError(interaction, "No tienes tanto dinero", combat.rivalDoc.getCurrency());

    let pet1 = await combat.changePet(interaction.user);
    if (!pet1) return;

    let pet2 = await combat.changePet(usuario.user);
    if (!pet2) return;

    return await combat.start(apuesta?.value);
}

module.exports = command;