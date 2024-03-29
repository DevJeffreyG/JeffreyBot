const { Command, Categories, Confirmation, LimitedTime, WillBenefit, BoostTypes, BoostObjetives, ErrorEmbed } = require("../../src/utils")
const ms = require("ms");
const { codeBlock } = require("discord.js");

const command = new Command({
    name: "temp",
    desc: "Agregar roles temporales o boosts",
    category: Categories.Administration
})

command.data
    .addSubcommand(sub => sub
        .setName("role")
        .setDescription("Agrega un role temporal a un usuario")
        .addUserOption(option => option
            .setName("usuario")
            .setDescription("El usuario al que se le agregará el rol")
            .setRequired(true))
        .addRoleOption(option => option
            .setName("role")
            .setDescription("El role a agregar")
            .setRequired(true))
        .addStringOption(option => option
            .setName("tiempo")
            .setDescription("El tiempo que tiene que pasar para eliminar el role: 1d, 20m, 10s, 1y...")
            .setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName("boost")
        .setDescription("Agrega un boost a un usuario")
        .addUserOption(option => option
            .setName("usuario")
            .setDescription("El usuario al que se le agregará el rol")
            .setRequired(true))
        .addStringOption(option => option
            .setName("tipo")
            .setDescription("El tipo de boost")
            .addChoices(
                { name: "Multiplicador", value: String(BoostTypes.Multiplier) },
                { name: "Probabilidad Boost", value: String(BoostTypes.Probabilities) }
            )
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("objetivo")
            .setDescription("Lo que va a modificar")
            .addChoices(
                { name: "Dinero", value: String(BoostObjetives.Currency) },
                { name: "EXP", value: String(BoostObjetives.Exp) },
                { name: "Todo", value: String(BoostObjetives.All) },
            )
            .setRequired(true))
        .addNumberOption(option => option
            .setName("valor")
            .setDescription("Valor del boost")
            .setMinValue(1.1)
            .setRequired(true))
        .addStringOption(option => option
            .setName("tiempo")
            .setDescription("El tiempo que tiene que pasar para eliminar el boost: 1d, 20m, 10s, 1y...")
            .setRequired(true))
        .addRoleOption(option => option
            .setName("role")
            .setDescription("El role a agregar con el boost")
            .setRequired(false))
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { subcommand } = params

    const { usuario, role, tiempo, tipo, objetivo, valor } = params[subcommand];

    const duration = ms(tiempo.value) || Infinity;

    switch (subcommand) {
        case "role":
            // llamar la funcion para hacer globaldata
            try {
                await LimitedTime(usuario.member, role.role.id, duration);
            } catch (err) {
                return new ErrorEmbed(interaction, {
                    type: "discordLimitation",
                    data: {
                        action: "temp",
                        help: `Algo no ha ido bien, no pude agregar el rol temporal.${codeBlock("json", err)}`
                    }
                }).send()
            }
            return interaction.editReply({ content: `${client.Emojis.Check} Agregado el temp role a ${usuario.user.tag} por ${tiempo.value}` });

        case "boost":
            let btype = tipo.value;
            let bobj = objetivo.value;
            let multi = valor.value;

            let toConfirm = [
                `**${usuario.user.tag}** será BENEFICIADO AÚN MÁS si aplica este boost`,
                `¿Estás segur@ de proseguir aún así?`
            ];

            const willBenefit = await WillBenefit(usuario.member)
            let confirmation = true;

            if (willBenefit) {
                confirmation = await Confirmation("Continuar", toConfirm, interaction);
            }

            if (!confirmation) return;

            // llamar la funcion para hacer un globaldata y dar el role con boost
            try {
                await LimitedTime(usuario.member, role?.role.id, duration, btype, bobj, multi);
            } catch (err) {
                return new ErrorEmbed(interaction, {
                    type: "discordLimitation",
                    data: {
                        action: "temp",
                        help: `Algo no ha ido bien, no pude agregar el rol temporal.${codeBlock("json", err)}`
                    }
                }).send()
            }

            return interaction.editReply({ content: `${client.Emojis.Check} Agregado el boost a ${usuario.user.tag} por ${tiempo.value}`, embeds: [] });
    }
}

module.exports = command