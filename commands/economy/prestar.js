const { Command, Categories, Confirmation, HumanMs, ErrorEmbed, FindNewId, Embed } = require("../../src/utils");
const ms = require("ms");
const moment = require("moment-timezone");

const command = new Command({
    name: "prestar",
    desc: "Présale de tu dinero a otro usuario para que lo tenga que pagar después",
    helpdesc: "Presta dinero que cobra interés hasta que te lo paguen devuelta",
    category: Categories.Economy
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
    desc: "Cada cuánto vas a cobrar intereses (1d, 1m, 1y, etc)",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { usuario, dinero, interes, tiempo } = params;
    const { Users } = models;
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const user = params.getUser();
    const lend_user = await Users.getOrCreate({ user_id: usuario.value, guild_id: interaction.guild.id });
    const every = ms(tiempo.value)

    if (every < ms("5m") || isNaN(every)) return new ErrorEmbed(interaction, {
        type: "badParams", data: {
            help: "El tiempo debe ser mayor a 5 minutos"
        }
    }).send();

    const toLend = dinero.value;

    if (!user.canBuy(toLend)) return new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "prestar",
            error: "No tienes suficiente dinero",
            money: user.economy.global.currency
        }
    }).send();

    const authorConfirmation = await Confirmation("Prestar dinero", [
        `Le prestarás **${Currency}${toLend.toLocaleString("es-CO")}** a ${usuario.member}.`,
        `Se le cobrará **${interes.value}%** de lo que te deba ${usuario.member} cada ${new HumanMs(every).human}.`,
        `**Después que confirmes se le pedirá confirmar a ${usuario.member} también**.`
    ], interaction)
    if (!authorConfirmation) return;

    await interaction.editReply({ content: usuario.member.toString() });
    await interaction.followUp({ content: usuario.member.toString() }).then(m => m.delete());

    let lendUserConfirmations = [
        `Le pagarás un **${interes.value}%** de lo que le debas a ${interaction.member} cada ${new HumanMs(every).human}.`,
        `Será un préstamo inicial de **${Currency}${toLend.toLocaleString("es-CO")}**`,
        `Para pagar tu deuda usa ${client.mentionCommand("pay")}.`,
        `Te llegará un mensaje de directo cada vez que se te cobren los intereses.`
    ];
    let existingDebt = lend_user.data.debts.find(x => x.user === interaction.user.id)
    if (existingDebt) {
        existingDebt.debt += toLend;
        existingDebt.interest = interes.value;
        existingDebt.pay_in = moment().add(every, "ms");
        existingDebt.every = every;

        lend_user.markModified("data");

        lendUserConfirmations[1] = `Se agregará a lo que le debes a ${interaction.member} **${Currency}${toLend.toLocaleString("es-CO")}**.`;
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
    await interaction.editReply({ content: null, embeds: [new Embed({ type: "success" })] });

    user.economy.global.currency -= toLend;
    lend_user.addCurrency(toLend);
}

module.exports = command;