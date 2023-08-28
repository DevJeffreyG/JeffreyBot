const { Command, Embed, GetRandomItem, Cooldowns, ErrorEmbed, Log, LogReasons, ChannelModules, PrettyCurrency, MinMaxInt } = require("../../src/utils")
const Chance = require("chance");
const { Responses, Colores } = require("../../src/resources");
const BadSetupError = require("../../src/errors/BadSetupError");

const command = new Command({
    name: "rob",
    desc: "Intenta robarle dinero normal a un usuario"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario al que intentarás robar",
    req: true
})

command.execute = async (interaction, models, params, client) => {

    const { usuario } = params;
    const { Users } = models;
    const { Currency, DarkCurrency } = client.getCustomEmojis(interaction.guild.id);

    const victimMember = usuario.member;

    if (victimMember === interaction.member) return interaction.reply({
        ephemeral: true, embeds: [
            new ErrorEmbed().defDesc("No es un buena idea robarte a ti mismo.")
        ]
    })

    await interaction.deferReply();

    const doc = params.getDoc();
    const user = params.getUser();
    const victim = await Users.getWork({ user_id: victimMember.id, guild_id: interaction.guild.id });

    let cool = await user.cooldown(Cooldowns.Rob, { save: false })
    if (cool) return interaction.editReply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    const { rob, limits } = doc.settings.quantities.percentages;
    let robSuccess = new Chance().bool({ likelihood: rob });

    const { success, fail } = limits.rob

    const successResponse = GetRandomItem(Responses.rob.success);
    const failResponse = GetRandomItem(Responses.rob.fail);

    const successPerc = MinMaxInt(success.min, success.max, { guild: interaction.guild, msg: "No se ha podido determinar recompensas" }) / 100;
    const failedPerc = MinMaxInt(fail.min, fail.max, { guild: interaction.guild, msg: "No se ha podido determinar castigos" }) / 100;

    const successValue = Math.round(victim.getCurrency() * successPerc);
    const failedValue = Math.round(user.getCurrency() * failedPerc);

    const minRequired = Math.round(victim.getCurrency() * min_success / 100);

    if (successValue <= 0) robSuccess = false;

    const successText = replace(successResponse.text)
    const failedText = replace(failResponse.text)

    let embed, suggester;

    //console.log(failedValue, successValue, robSuccess)

    if ((user.getCurrency() < minRequired) || (minRequired < 0)) {
        await user.save();
        let e = new ErrorEmbed(interaction)
            .defDesc("**No tenías suficiente dinero como para robarle.**")

        if (minRequired > 0) e.defFooter({ text: `Necesitas al menos ${minRequired.toLocaleString("es-CO")} ${Currency.name} en tu cuenta.` });
        return e.send();
    }

    // Fallido
    if (!robSuccess) {
        suggester = getAuthor(failResponse);

        user.economy.global.currency -= failedValue;
        await user.save();

        embed = new Embed()
            .defColor(Colores.rojo)
            .defDesc(`${failedText}.`);
    } else {
        suggester = getAuthor(successResponse);

        user.addCurrency(successValue);
        victim.economy.global.currency -= successValue;

        await victim.save();

        embed = new Embed()
            .defColor(Colores.verdejeffrey)
            .defDesc(`${successText}.`)
    }

    if (suggester)
        embed.defFooter({
            text: `• Respuesta sugerida por ${suggester.user?.username ?? "un usuario"}`,
            icon: typeof suggester != "boolean" ? suggester.displayAvatarURL({ dynamic: true }) : interaction.guild.iconURL({ dynamic: true })
        });

    return interaction.editReply({ embeds: [embed] });

    function getAuthor(obj) {
        if (!obj.author) return false;

        let author = interaction.guild.members.cache.get(obj.author) ?? true;

        return author;
    }

    function replace(text) {
        return text.replace(
            new RegExp("{ MONEY }", "g"),
            `${PrettyCurrency(interaction.guild, robSuccess ? successValue : failedValue)}`
        ).replace(
            new RegExp("{ MEMBER }", "g"),
            `**${victimMember.displayName}**`
        ).replace(
            new RegExp("{ FAKE MONEY }", "g"),
            `${new Chance().integer({ min: victim.getCurrency(), max: victim.getCurrency() * 3 }).toLocaleString("es-CO")} ${Currency.name}`
        ).replace(
            new RegExp("{ MONEY NAME }", "g"), Currency.name
        ).replace(
            new RegExp("{ DARK NAME }", "g"), DarkCurrency.name
        ).replace(
            new RegExp("{ OWNER }", "g"), interaction.guild.members.cache.get(interaction.guild.ownerId)
        )
    }
}

module.exports = command;