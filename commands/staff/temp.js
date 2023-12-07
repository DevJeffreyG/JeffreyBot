const { Command, Confirmation, LimitedTime, WillBenefit, BoostTypes, BoostObjetives, Embed, HumanMs, Enum, Collector, EndReasons } = require("../../src/utils")
const ms = require("ms");
const { codeBlock, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { DiscordLimitationError, BadParamsError } = require("../../src/errors");

const command = new Command({
    name: "temp",
    desc: "Agregar roles temporales o boosts"
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
        .addIntegerOption(option => option
            .setName("tipo")
            .setDescription("El tipo de boost")
            .addChoices(...new Enum(BoostTypes).complexArray())
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName("objetivo")
            .setDescription("Lo que va a modificar")
            .addChoices(...new Enum(BoostObjetives).complexArray())
            .setRequired(true))
        .addNumberOption(option => option
            .setName("valor")
            .setDescription("Valor del boost")
            .setMinValue(0.01)
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
    .addSubcommand(remove => remove
        .setName("del")
        .setDescription("Elimina roles temporales de un usuario")
        .addUserOption(u => u
            .setName("usuario")
            .setDescription("El usuario al que quieres eliminarle el rol temporal")
            .setRequired(true)
        )
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { Users } = models;
    const { subcommand } = params
    const { Emojis } = client;

    const { usuario, role, tiempo, tipo, objetivo, valor } = params[subcommand];

    switch (subcommand) {
        case "role": {
            const duration = ms(tiempo.value);
            if (duration < ms("1s") || isNaN(duration))
                throw new BadParamsError(interaction, "El tiempo debe ser mayor o igual a 1 segundo");

            // llamar la funcion para hacer globaldata
            try {
                await LimitedTime(usuario.member, role.role.id, duration);
            } catch (err) {
                throw new DiscordLimitationError(interaction, "temp", [
                    `Algo no ha ido bien`,
                    `No se pudo agregar el role temporal`,
                    codeBlock("json", err)
                ])
            }

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success", data: {
                            desc: `Agregado el Rol Temporal a **${usuario.user.username}** por ${new HumanMs(duration).human}`
                        }
                    })
                ]
            })
        }
        case "boost": {
            const duration = ms(tiempo.value);
            if (duration < ms("1m") || isNaN(duration))
                throw new BadParamsError(interaction, "El tiempo debe ser mayor o igual a 1 minuto");

            let btype = tipo.value;
            let bobj = objetivo.value;
            let multi = valor.value;

            let toConfirm = [
                `**${usuario.user.username}** será BENEFICIADO AÚN MÁS si aplica este boost`,
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
                await LimitedTime(usuario.member, role?.role.id, duration, {}, btype, bobj, multi);
            } catch (err) {
                throw new DiscordLimitationError(interaction, "temp", [
                    `Algo no ha ido bien`,
                    `No se pudo agregar el role temporal`,
                    codeBlock("json", err)
                ])
            }

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success", data: {
                            desc: `Agregado el Boost a **${usuario.user.username}** por ${new HumanMs(duration).human}`
                        }
                    })
                ]
            })
        }
        case "del": {
            // Crear lista de los Boosts disponibles

            let selectMenu = new StringSelectMenuBuilder()
                .setCustomId("selectTempRole")
                .setPlaceholder("Selecciona los TempRoles que quieras eliminar")
                .setMinValues(0);

            const user = await Users.getWork({ user_id: usuario.value, guild_id: interaction.guild.id });
            for (const temp of user.data.temp_roles) {
                if (!temp.id) continue

                let emoji = temp.special.type ? "🚀" : "👤";
                let content;
                if (temp.special.type) {
                    let type = new Enum(BoostTypes).translate(temp.special.type);
                    let objetive = new Enum(BoostObjetives).translate(temp.special.objetive);

                    content = `Boost ${type} de ${objetive} x${temp.special.value}`
                }

                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(content)
                        .setValue(String(temp.id))
                        .setEmoji(emoji)
                )
            }

            selectMenu.setMaxValues(selectMenu.options.length);

            let components = [
                new ActionRowBuilder()
                    .setComponents(selectMenu),
                new ActionRowBuilder()
                    .setComponents(
                        new ButtonBuilder()
                            .setCustomId("stop")
                            .setLabel("Cancelar")
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji(Emojis.Cross)
                    )
            ]

            await interaction.editReply({ components })

            const filter = (inter) => inter.isStringSelectMenu() || inter.isButton() && inter.user.id === interaction.user.id;
            const collector = new Collector(interaction, { filter }).raw();

            collector.on("collect", async i => {
                if (i.customId === "stop") return collector.stop(EndReasons.StoppedByUser);
                else if (i.customId === "selectTempRole") {
                    let left = user.data.temp_roles.filter(x => {
                        return !i.values.includes(String(x.id))
                    });

                    user.data.temp_roles = left;
                    await user.save();
                    
                    return collector.stop(EndReasons.Done);
                }
            })

            break;
        }
    }
}

module.exports = command