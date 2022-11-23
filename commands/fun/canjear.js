const { Command, Categories, LimitedTime, WillBenefit, HumanMs, ErrorEmbed, ItemObjetives, Enum, BoostTypes } = require("../../src/utils");

const command = new Command({
    name: "canjear",
    desc: "Canjeas alguna clave para recompensas dentro del servidor",
    category: Categories.Fun
})

command.addOption({
    type: "string",
    name: "llave",
    desc: "Literalmente la llame a canjear",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });
    const { Guilds, Users } = models;
    const { Emojis } = client;
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const _key = params.llave.value;

    const doc = await Guilds.getOrCreate(interaction.guild.id);
    const key = doc.data.keys.find(x => x.code === _key);

    const error = new ErrorEmbed(interaction, {
        type: "doesntExist",
        data: {
            action: "redeem",
            missing: `La llave \`${_key}\``,
            context: "este servidor"
        }
    })

    if (!key) return error.send();

    const user = await Users.getOrCreate({
        user_id: interaction.user.id,
        guild_id: interaction.guild.id
    });

    // revisar que no lo haya usado antes
    if (key.config.usedBy.find(x => x === interaction.user.id)) {
        return interaction.editReply({ content: `${interaction.user}, ya has usado esta key, no puedes volverla a usar :(` });
    }

    const reward = key.reward;
    let reply;

    switch (reward.type) {
        case ItemObjetives.Currency:
            user.economy.global.currency += Number(reward.value);
            user.data.counts.normal_currency += Number(reward.value);
            reply = `Se han agregado ${Currency}${Number(reward.value).toLocaleString("es-CO")} a tu cuenta.`
            break;

        case ItemObjetives.Exp:
            user.economy.global.exp += Number(reward.value);
            reply = `Se han agregado ${Number(reward.value).toLocaleString("es-CO")} puntos de EXP a tu cuenta.`
            break;

        case ItemObjetives.Role:
            const isTemp = (reward.duration > 0 && reward.duration != Infinity) ?? false;
            const role = interaction.guild.roles.cache.find(x => x.id === reward.value);

            if (interaction.member.roles.cache.find(x => x === role)) {
                return interaction.editReply(`${interaction.user}, no puedes usar esta key porque ya tienes el rol que da :(`)
            }

            if (isTemp) user = await LimitedTime(interaction.member, reward.value, reward.duration);
            else interaction.member.roles.add(role);

            reply = `Se ha agregado el role \`${role.name}\` ${isTemp ? `por ${new HumanMs(reward.duration).human}` : "permanentemente"}.`
            break;

        case ItemObjetives.Boost:
            const brole = interaction.guild.roles.cache.find(x => x.id === reward.value);
            const willBenefit = await WillBenefit(interaction.member);

            if (interaction.member.roles.cache.find(x => x === brole)) {
                return interaction.editReply(`${interaction.user}, no puedes usar esta key porque ya tienes el rol que da :(`)
            }

            if (willBenefit) {
                return interaction.editReply(`${interaction.user}, no puedes usar esta key te beneficiaría aún más con el boost que tienes :(`);
            }

            // llamar la funcion para hacer un globaldata y dar el role con boost
            user = await LimitedTime(interaction.member, brole.id, reward.duration, reward.boost_type, reward.boost_objetive, reward.boost_value);

            reply = `Se ha activado el boost ${new Enum(BoostTypes).translate(reward.boost_type) === BoostTypes.Multiplier ? "multiplicador" : "de probabilidad"} x${reward.boost_value} por ${new HumanMs(reward.duration).human}.`
            break;

        default:
            return interaction.editReply({ embeds: [new ErrorEmbed({ type: "commandError", data: { id: key.id, unknown: reward.type } })] })
    }

    // loggear que fue usado porque aún existe (lol)
    key.config.usedBy.push(interaction.user.id);
    key.config.used += 1;
    await doc.save()

    await user.save();

    // si llega al punto máximo de usos borrar
    if (key.config.maxuses === key.config.used) await key.remove();

    return interaction.editReply({ content: `✅ ${reply}` });
}

module.exports = command;