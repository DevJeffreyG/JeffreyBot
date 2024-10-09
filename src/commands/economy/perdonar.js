const { time } = require("discord.js");
const { FetchError } = require("../../errors");
const { Colores } = require("../../resources");
const { Command, Confirmation, PrettyCurrency, SendDirect, DirectMessageType, Embed } = require("../../utils");

const command = new Command({
    name: "perdonar",
    desc: "Cancela un préstamo que tengas con un usuario"
});

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario con el que vas a cancelar la deuda que tiene contigo",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    if (!interaction.deferred) await interaction.deferReply();
    const { Users } = models;
    const { usuario } = params;

    const user = await Users.findOne({ user_id: usuario.value, "data.debts": { "$elemMatch": { user: interaction.user.id } } });
    if (!user) throw new FetchError(interaction, "Préstamo", [
        "No tienes un préstamo con este usuario"
    ]);

    const debtIndex = user.data.debts.findIndex(x => x.user === interaction.user.id);
    const debt = user.data.debts[debtIndex];
    const debtMember = interaction.guild.members.cache.get(user.user_id);

    let confirmation = await Confirmation("Perdonar", [
        `La deuda de ${debtMember} que tiene contigo.`,
        `De ${PrettyCurrency(interaction.guild, debt.debt)} a **${debt.interest}%** (${PrettyCurrency(interaction.guild, Math.round(debt.debt * debt.interest / 100))}).`,
        `Desde ${time(debt.since, "F")}, pago de intereses ${time(debt.pay_in, "R")}.`,
        `Se notificará a ${debtMember} que se perdonó la deuda.`
    ], interaction);
    if (!confirmation) return;

    let embed = new Embed()
        .defColor(Colores.verde)
        .defTitle(`Préstamo perdonado`)
        .defDesc(`**—** La deuda que tenías con ${interaction.member} fue perdonada.
**—** Le debías ${PrettyCurrency(interaction.guild, debt.debt)}.`)

    user.data.debts.splice(debtIndex, 1);
    await user.save();

    try {
        await SendDirect(interaction, debtMember, DirectMessageType.Payments, {
            embeds: [embed]
        })
    } catch (err) {
        console.error("🔴 %s", err);
    }

    return await interaction.editReply({ embeds: [new Embed({ type: "success" })] })
}

module.exports = command;