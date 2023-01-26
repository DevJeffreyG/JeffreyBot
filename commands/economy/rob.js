const { Command, Categories, Embed, GetRandomItem, Cooldowns } = require("../../src/utils")
const Chance = require("chance");
const { Responses, Colores } = require("../../src/resources");

const command = new Command({
    name: "rob",
    desc: "Intenta robarle dinero normal a un usuario",
    category: Categories.Economy
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario al que intentarás robar",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { usuario } = params;
    const { Users, Guilds } = models;
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const victimMember = usuario.member;

    if (victimMember === interaction.member) {
        interaction.followUp({ ephemeral: true, content: "No es un buena idea robarte a ti mismo." })
        return interaction.deleteReply();
    }

    const doc = await Guilds.getOrCreate(interaction.guild.id);
    const user = await Users.getOrCreate({ user_id: interaction.user.id, guild_id: interaction.guild.id });
    const victim = await Users.getOrCreate({ user_id: victimMember.id, guild_id: interaction.guild.id });

    let cool = await user.cooldown(Cooldowns.Rob, { save: false })
    if (cool) return interaction.editReply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    const { min_success, max_success, min_fail, max_fail, percentage } = doc.settings.quantities.rob;

    const success = GetRandomItem(Responses.rob.success);
    const fail = GetRandomItem(Responses.rob.fail);

    const successPerc = new Chance().floating({ min: min_success, max: max_success, fixed: 2 }) / 100;
    const failedPerc = new Chance().floating({ min: min_fail, max: max_fail, fixed: 2 }) / 100;

    const successValue = Math.round(victim.economy.global.currency * successPerc);
    const failedValue = Math.round(user.economy.global.currency * failedPerc);

    const successText = replace(success.text)
    const failedText = replace(fail.text)

    if (!new Chance().bool({likelihood: percentage })) {
        // Fallido
        var suggester = getAuthor(fail);

        user.economy.global.currency -= failedValue;

        var embed = new Embed()
            .defColor(Colores.rojo)
            .defDesc(`${failedText}.`);
    } else {
        var suggester = getAuthor(success);

        user.economy.global.currency += successValue;
        victim.economy.global.currency -= successValue;

        await victim.save();

        var embed = new Embed()
            .defColor(Colores.verdejeffrey)
            .defDesc(`${successText}.`)
    }

    if (suggester)
        embed.defFooter({
            text: `• Respuesta sugerida por ${suggester.user?.tag ?? "un usuario"}`,
            icon: typeof suggester != "boolean" ? suggester.displayAvatarURL({ dynamic: true }) : interaction.guild.iconURL({ dynamic: true })
        });

    await user.save();
    return interaction.editReply({ embeds: [embed] });
r
    function getAuthor(obj) {
        if (!obj.author) return false;

        let author = interaction.guild.members.cache.get(obj.author) ?? true;

        return author;
    }

    function replace(text) {
        return text.replace(
            new RegExp("{ MONEY }", "g"),
            `**${Currency}${successValue.toLocaleString("es-CO")}**`
        ).replace(
            new RegExp("{ MEMBER }", "g"),
            `**${victimMember.displayName}**`
        )
    }
}

module.exports = command;