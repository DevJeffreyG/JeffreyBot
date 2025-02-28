const { MessageFlags } = require("discord.js");
const { BadCommandError, DoesntExistsError } = require("../../errors");
const { Command, LimitedTime, WillBenefit, HumanMs, ItemObjetives, BoostTypes, Embed, PrettyCurrency, Enum } = require("../../utils");

const command = new Command({
    name: "canjear",
    desc: "Canjeas alguna clave para recompensas dentro del servidor"
})

command.addOption({
    type: "string",
    name: "llave",
    desc: "La llave a canjear",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const _key = params.llave.value;

    const doc = params.getDoc();
    const user = params.getUser();
    const key = doc.data.keys.find(x => x.code === _key);

    if (!key)
        throw new DoesntExistsError(interaction, `La llave \`${_key}\``, "este servidor");

    // si llega al punto máximo de usos borrar
    if (key.config.used >= key.config.maxuses) {
        await key.deleteOne();

        await interaction.deleteReply();
        return await doc.save();
    }

    // revisar que no lo haya usado antes
    if (key.config.usedBy.find(x => x === interaction.user.id))
        return await interaction.editReply({ content: `${interaction.user}, ya has usado esta llave, no puedes volverla a usar :(` });

    const reward = key.reward;
    let reply;

    switch (reward.type) {
        case ItemObjetives.Currency:
            await user.addCurrency(reward.value)

            reply = `Se han agregado ${PrettyCurrency(interaction.guild, reward.value)} a tu cuenta.`
            break;

        case ItemObjetives.Exp:
            user.economy.global.exp += Number(reward.value);
            reply = `Se han agregado  **${Number(reward.value).toLocaleString("es-CO")}** puntos de EXP a tu cuenta.`

            await user.save();
            break;

        case ItemObjetives.Role:
            const isTemp = (reward.duration > 0 && reward.duration != Infinity) ?? false;
            const role = interaction.guild.roles.cache.get(reward.value);

            if (interaction.member.roles.cache.find(x => x === role)) {
                return await interaction.editReply(`${interaction.user}, no puedes usar esta key porque ya tienes el rol que da :(`)
            }

            if (isTemp) await LimitedTime(interaction.member, reward.value, reward.duration);
            else await interaction.member.roles.add(role);

            reply = `Se ha agregado el role \`${role.name}\` **${isTemp ? `por ${new HumanMs(reward.duration).human}` : "permanentemente"}**.`
            break;

        case ItemObjetives.Boost:
            const brole = interaction.guild.roles.cache.get(reward.value);
            const willBenefit = await WillBenefit(interaction.member);

            if (interaction.member.roles.cache.find(x => x === brole)) {
                return interaction.editReply(`${interaction.user}, no puedes usar esta key porque ya tienes el rol que da :(`)
            }

            if (willBenefit)
                return await interaction.editReply(`${interaction.user}, no puedes usar esta key porque te beneficiaría aún más con el boost que tienes :(`);

            // llamar la funcion para hacer un globaldata y dar el role con boost
            await LimitedTime(interaction.member, brole?.id, reward.duration, {}, reward.boost_type, reward.boost_objetive, reward.boost_value);

            reply = `Se ha activado el **Boost ${new Enum(BoostTypes).translate(reward.boost_type)}** **x${reward.boost_value}** por **${new HumanMs(reward.duration).human}**`
            break;

        default:
            throw new BadCommandError(interaction, `${reward.type} no existe`);
    }

    // loggear que fue usado porque aún existe (lol)
    key.config.usedBy.push(interaction.user.id);
    key.config.used += 1;
    await doc.save()

    return await interaction.editReply({
        embeds: [
            new Embed({
                type: "success", data: {
                    desc: reply
                }
            })
        ]
    });
}

module.exports = command;