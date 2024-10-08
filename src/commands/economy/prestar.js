const { Command, Confirmation, HumanMs, ErrorEmbed, FindNewId, Embed, PrettyCurrency } = require("../../utils");
const ms = require("ms");
const moment = require("moment-timezone");
const Chance = require("chance");

const { BadParamsError, EconomyError } = require("../../errors");

const command = new Command({
    name: "prestar",
    desc: "Présale de tu dinero a otro usuario para que lo tenga que pagar después",
    helpdesc: "Presta dinero que cobra interés hasta que te lo paguen devuelta"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "A quién le vas a prestar dinero",
    req: true
})

command.addOption({
    type: "integer",
    name: "dinero",
    desc: "Lo que le vas a prestar",
    min: 1,
    req: true
})

command.addOption({
    type: "number",
    name: "interes",
    desc: "Cuánto vas a cobrar después del tiempo (20%, 90%, 15%, etc)",
    min: 0.01,
    max: 99.9,
    req: true
})

command.addOption({
    type: "string",
    name: "tiempo",
    desc: "Cada cuánto vas a cobrar intereses (1d, 5m, 1y, etc)",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { usuario, dinero, interes, tiempo } = params;
    const { Users } = models;

    const user = params.getUser();
    const lend_user = await Users.getWork({ user_id: usuario.value, guild_id: interaction.guild.id });
    const every = ms(tiempo.value)

    if (interaction.user === usuario.user)
        return new ErrorEmbed(interaction).defDesc("Por mucho que quieras prestarte dinero, no es conveniente.").send();

    if (every < ms("5m") || isNaN(every))
        throw new BadParamsError(interaction, "El tiempo debe ser mayor o igual a 5 minutos");

    const toLend = dinero.value;
    const deuda = PrettyCurrency(interaction.guild, toLend);

    if (!user.affords(toLend))
        throw new EconomyError(interaction, "No tienes tanto dinero", user.getCurrency())

    const authorConfirmation = await Confirmation("Prestar dinero", [
        `Le prestarás ${deuda} a ${usuario.member}.`,
        `Se le cobrará **${interes.value}%** de lo que te deba ${usuario.member} cada ${new HumanMs(every).human}.`,
        `**Después que confirmes se le pedirá confirmar a ${usuario.member} también**.`
    ], interaction)
    if (!authorConfirmation) return;

    await interaction.editReply({ content: usuario.member.toString() });
    await interaction.followUp({ content: usuario.member.toString() }).then(m => m.delete());

    let lendUserConfirmations = [
        `Le pagarás un **${interes.value}%** de lo que le debas a ${interaction.member} cada ${new HumanMs(every).human}.`,
        `Será un préstamo inicial de ${deuda}`,
        `Para pagar tu deuda usa ${client.mentionCommand("pay")}.`,
        `Te llegará un mensaje de directo **CADA VEZ** que se te cobren los intereses.`
    ];
    let existingDebt = lend_user.data.debts.find(x => x.user === interaction.user.id)
    if (existingDebt) {
        existingDebt.debt += toLend;
        existingDebt.interest = interes.value;
        existingDebt.pay_in = moment().add(every, "ms");
        existingDebt.every = every;

        lend_user.markModified("data");

        lendUserConfirmations[1] = `Se agregará ${deuda} a lo que le debes a ${interaction.member}.`;
    } else {
        lend_user.data.debts.push({
            user: interaction.user.id,
            debt: toLend,
            interest: interes.value,
            pay_in: moment().add(every, "ms"),
            every,
            id: FindNewId(await Users.find(), "data.debts", "id")
        })
    }

    const lendConfirmation = await Confirmation("Aceptar préstamo", lendUserConfirmations, interaction, usuario.user);
    if (!lendConfirmation) return;

    const messenger = interaction.member;
    const lendMember = usuario.member;

    let possibleDescriptions = [
        `${messenger} le prestó ${deuda} a ${lendMember}`,
        `${lendMember} ahora le debe ${deuda} a ${messenger}`,
        `${deuda} fueron prestados a ${lendMember} por ${messenger}`
    ];

    let description = new Chance().pickone(possibleDescriptions);

    let doneEmbed = new Embed({
        type: "success",
        data: {
            desc: description
        }
    })
    await interaction.editReply({ content: null, embeds: [doneEmbed] });

    await user.removeCurrency(toLend);
    await lend_user.addCurrency(toLend);

    await user.save()
}

module.exports = command;