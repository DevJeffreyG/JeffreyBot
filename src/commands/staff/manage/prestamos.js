const { Command, PrettyCurrency, InteractivePages, Confirmation, Embed } = require("../../../utils")
const { Colores } = require("../../../resources")
const { time } = require("discord.js")
const { DoesntExistsError } = require("../../../errors")

const command = new Command({
    name: "manage-prestamos",
    desc: "Administra los préstamos de un usuario"
})

command.addSubcommand({
    name: "check",
    desc: "Lista de préstamos activos con un usuario"
})

command.addSubcommand({
    name: "perdonar",
    desc: "Perdona el préstamo que un usuario tenga con alguien"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "Usuario que prestó el dinero",
    req: true,
    sub: "check"
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "ID del préstamo a perdonar",
    req: true,
    sub: "perdonar"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { subcommand } = params
    const { usuario, id } = params[subcommand];
    const { Users } = models;

    switch (subcommand) {
        case "check": {
            let items = new Map();
            let usersWithLoan = await Users.find({
                guild_id: interaction.guild.id,
                "data.debts": {
                    $all: [
                        { "$elemMatch": { user: usuario.value } },
                    ]
                }
            });

            for (const user of usersWithLoan) {
                const loan = user.data.debts.find(x => x.user === usuario.value)
                items.set(loan.id, {
                    member: interaction.guild.members.cache.get(user.user_id),
                    debt: PrettyCurrency(interaction.guild, loan.debt),
                    paying: PrettyCurrency(interaction.guild, Math.round(loan.debt * loan.interest / 100)),
                    interest: loan.interest,
                    next: time(loan.pay_in, "R"),
                    since: time(loan.since, "F"),
                    id: loan.id
                })
            }

            const interactive = new InteractivePages({
                title: `Lista de préstamos de ${usuario.member.displayName}`,
                author_icon: usuario.member.displayAvatarURL(),
                color: Colores.verde,
                addon: `**▸** {debt} a **{interest}%** ({paying}).\n**▸** Con {member} desde {since}.\n**▸** Pago de intereses {next}.\n**▸** ID: \`{id}\`.\n\n`
            }, items, 5)

            await interactive.init(interaction);
            break;
        }

        case "perdonar": {
            const user = await Users.findOne({ "data.debts": { "$elemMatch": { id: id.value } } });
            if (!user) throw new DoesntExistsError(interaction, `La deuda con id \`${id.value}\``, "este servidor");

            const debtIndex = user.data.debts.findIndex(x => x.id === id.value);
            const debt = user.data.debts[debtIndex];
            const debtMember = interaction.guild.members.cache.get(user.user_id);
            const loanMember = interaction.guild.members.cache.get(debt.user);

            let confirmation = await Confirmation("Perdonar", [
                `La deuda con ID \`${debt.id}\` de ${debtMember} que tiene con ${loanMember}.`,
                `De ${PrettyCurrency(interaction.guild, debt.debt)} a **${debt.interest}%** (${PrettyCurrency(interaction.guild, Math.round(debt.debt * debt.interest / 100))}).`,
                `Desde ${time(debt.since, "F")}, pago de intereses ${time(debt.pay_in, "R")}.`,
                `NO se notificará a ningún usuario.`
            ], interaction);
            if (!confirmation) return;

            user.data.debts.splice(debtIndex, 1);

            await user.save();
            return await interaction.editReply({embeds: [new Embed({type: "success"})]})
            break;
        }
    }
}

module.exports = command;