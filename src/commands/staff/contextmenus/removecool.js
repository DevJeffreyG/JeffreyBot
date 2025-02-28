const { ApplicationCommandType, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require("discord.js")
const { ContextMenu, Enum, Cooldowns, Collector } = require("../../../utils")

const command = new ContextMenu({
    name: "Eliminar Cooldown",
    type: ApplicationCommandType.User
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const { Users } = models
    const member = interaction.guild.members.cache.get(params.user.id)
    const user = await Users.getWork({ user_id: member.id, guild_id: member.guild.id });

    const cools = new Enum(Cooldowns).complexArray({first: "label", valueString: true});

    const row = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("cooldownSelector")
                .setPlaceholder("Selecciona el tipo de Cooldown")
                .addOptions(
                    ...cools,
                    { label: "Cancelar", value: "cancel", emoji: client.Emojis.Cross }
                )
        )

    await interaction.editReply({ components: [row] })

    const filter = (inter) => inter.isStringSelectMenu() && inter.user.id === interaction.user.id;
    const collector = new Collector(interaction, { filter, max: 1 }).raw();

    collector.on("collect", async (i) => {
        const cooldownSelected = i.values[0];

        if(cooldownSelected === "cancel") return interaction.deleteReply();

        user.delCooldown(cooldownSelected);

        return await interaction.deleteReply();
    })
}

module.exports = command;