const { Command, Embed, Cooldowns, ErrorEmbed, PrettyCurrency, MinMaxInt } = require("../../utils")
const Chance = require("chance");
const { Responses, Colores } = require("../../resources");
const { MessageFlags } = require("discord.js");

const command = new Command({
    name: "rob",
    desc: "Intenta robarle a un usuario su dinero usable"
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

    if (victimMember === interaction.member) return await interaction.reply({
        flags: [MessageFlags.Ephemeral], embeds: [
            new ErrorEmbed().defDesc("No es un buena idea robarte a ti mismo.")
        ]
    })

    await interaction.deferReply();

    const doc = params.getDoc();
    const user = params.getUser();
    const victim = await Users.getWork({ user_id: victimMember.id, guild_id: interaction.guild.id });

    let cool = await user.cooldown(Cooldowns.Rob, { save: false })
    if (cool) return await interaction.editReply({
        content: null, embeds: [
            new Embed({ type: "cooldown", data: { cool } })
        ]
    });

    const { success, fail } = doc.settings.quantities.percentages.limits.rob;

    let likelihood;

    if(victim.getAllMoney() < 0){
        likelihood = 100;
    } else if(user.getAllMoney() < 0) {
        likelihood = 20;
    } else {
        likelihood = user.getAllMoney() / (victim.getAllMoney() + user.getAllMoney()) * 100;
    }

    if(likelihood > 100) likelihood = 100;
    else if(likelihood < 0) likelihood = 0;

    const robFail = new Chance().bool({ likelihood });
    const successValue = Math.round((100 - likelihood) / 100 * Math.abs(victim.getCurrency()) * (MinMaxInt(success.min, success.max, { guild: interaction.guild, msg: "No se ha podido determinar recompensa" }) / 100));

    const failedPerc = MinMaxInt(fail.min, fail.max, { guild: interaction.guild, msg: "No se ha podido determinar castigos" }) / 100;
    const failedValue = Math.round(Math.abs(user.getCurrency()) * failedPerc);

    // Embed Text
    // TODO: 2.2.X HACER QUE LAS RESPUESTAS ESTÉN EN LA BASE DE DATOS
    const successResponse = new Chance().pickone(Responses.rob.success);
    const failResponse = new Chance().pickone(Responses.rob.fail);
    const successText = replace(successResponse.text)
    const failedText = replace(failResponse.text)

    let embed, suggester;

    // Fallido
    if (robFail) {
        suggester = getAuthor(failResponse);

        await user.removeCurrency(failedValue);
        await doc.addToBank(failedValue, "user_actions");
        await user.save();

        embed = new Embed()
            .defColor(Colores.rojo)
            .defDesc(`${failedText}.`);
    } else {
        suggester = getAuthor(successResponse);

        await user.addCurrency(successValue);
        await victim.removeCurrency(successValue);

        await victim.save();

        embed = new Embed()
            .defColor(Colores.verdejeffrey)
            .defDesc(`${successText}.`)
    }

    if (suggester)
        embed.defFooter({
            text: `• Respuesta sugerida por ${suggester?.displayName ?? "un usuario"}`,
            icon: typeof suggester != "boolean" ? suggester.displayAvatarURL() : interaction.guild.iconURL()
        });

    return await interaction.editReply({ embeds: [embed] });

    function getAuthor(obj) {
        if (!obj.author) return false;

        let author = interaction.guild.members.cache.get(obj.author) ?? true;

        return author;
    }

    function replace(text) {
        return text.replace(
            new RegExp("{ MONEY }", "g"),
            `${PrettyCurrency(interaction.guild, !robFail ? successValue : failedValue)}`
        ).replace(
            new RegExp("{ MEMBER }", "g"),
            `**${victimMember.displayName}**`
        ).replace(
            new RegExp("{ FAKE MONEY }", "g"),
            `${new Chance().integer({ min: Math.abs(victim.getAllMoney()), max: Math.abs(victim.getAllMoney() * 5) }).toLocaleString("es-CO")} ${Currency.name}`
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