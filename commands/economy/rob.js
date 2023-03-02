const { Command, Categories, Embed, GetRandomItem, Cooldowns, ErrorEmbed, Log, LogReasons, ChannelModules } = require("../../src/utils")
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

    const { usuario } = params;
    const { Users, Guilds } = models;
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const victimMember = usuario.member;

    if (victimMember === interaction.member) return interaction.reply({ ephemeral: true, content: "No es un buena idea robarte a ti mismo." })

    await interaction.deferReply();

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

    let robSuccess = new Chance().bool({ likelihood: percentage });

    const success = GetRandomItem(Responses.rob.success);
    const fail = GetRandomItem(Responses.rob.fail);

    let successPerc, failedPerc;

    try {
        successPerc = new Chance().floating({ min: min_success, max: max_success, fixed: 2 }) / 100;
        failedPerc = new Chance().floating({ min: min_fail, max: max_fail, fixed: 2 }) / 100;
    } catch (err) {
        if (err instanceof RangeError) {
            new Log(message)
                .setReason(LogReasons.Error)
                .setTarget(ChannelModules.StaffLogs)
                .send({
                    embeds: [
                        new ErrorEmbed()
                            .defDesc(`No se ha podido determinar recompensas o castigos. Mínimos y máximos deben ser menores y mayores los unos con los otros. \`/config dashboard\`.`)
                            .defFields([
                                { up: "Min Success", down: String(min_success), inline: true },
                                { up: "Max Money", down: String(max_success), inline: true },
                                { up: "||                             ||", down: String(" ") },
                                { up: "Min Fail", down: String(min_fail), inline: true },
                                { up: "Max Fail", down: String(max_fail), inline: true }
                            ])
                            .raw()
                    ]
                });

            successPerc = 0;
            failedPerc = 0;
        }
    }



    const successValue = Math.round(victim.economy.global.currency * successPerc);
    const failedValue = Math.round(user.economy.global.currency * failedPerc);

    const successText = replace(success.text)
    const failedText = replace(fail.text)

    if (successValue === 0) robSuccess = false;

    if (!robSuccess) {
        // Fallido
        if (failedValue === 0) return new ErrorEmbed(interaction).defDesc("**No tenías suficiente dinero como para hacer eso.**").send();
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
            `**${Currency}${robSuccess ? successValue.toLocaleString("es-CO") : failedValue.toLocaleString("es-CO")}**`
        ).replace(
            new RegExp("{ MEMBER }", "g"),
            `**${victimMember.displayName}**`
        )
    }
}

module.exports = command;