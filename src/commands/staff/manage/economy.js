const { Command, Embed, PrettyCurrency } = require("../../../utils")
const { Colores } = require("../../../resources")

const command = new Command({
    name: "manage-economy",
    desc: "Administra los balances de un usuario"
});

command.addSubcommandGroup({
    name: "currency",
    desc: "Administra el dinero de alguien"
})

command.addSubcommandGroup({
    name: "darkcurrency",
    desc: "Administra el dinero de la DarkShop de alguien"
})

command.addSubcommand({
    name: "add",
    desc: "Añadir dinero a alguien",
    group: "currency"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "Usuario al que le vas a agregar dinero",
    req: true,
    sub: "currency.add"
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "N# de dinero a agregar",
    req: true,
    sub: "currency.add"
})

command.addSubcommand({
    name: "add",
    desc: "Añadir dinero de DarkShop a alguien",
    group: "darkcurrency"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "Usuario al que le vas a agregar dinero de la DarkShop",
    req: true,
    sub: "darkcurrency.add"
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "N# de dinero DS a agregar",
    req: true,
    sub: "darkcurrency.add"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { subgroup, subcommand, currency, darkcurrency } = params

    switch (subgroup) {
        case "currency":
            await command.execCurrency(interaction, models, { subcommand, currency }, client)
            break;

        case "darkcurrency":
            await command.execDarkCurrency(interaction, models, { subcommand, darkcurrency }, client)
            break;
    }
}

command.execCurrency = async (interaction, models, params, client) => {
    const { currency } = params;
    const { usuario, cantidad } = currency
    const { Users } = models

    const user = await Users.getWork({ user_id: usuario.value, guild_id: usuario.member.guild.id })

    await user.addCurrency(cantidad.value)

    let embed = new Embed()
        .defAuthor({ text: `¡Dinero para ti, ${usuario.member.displayName}!`, icon: usuario.member.guild.iconURL() })
        .defDesc(`**+** ${PrettyCurrency(interaction.guild, cantidad.value)}
— ${PrettyCurrency(interaction.guild, user.getCurrency())}`)
        .defColor(Colores.verde)
        .defThumbnail(usuario.member.displayAvatarURL());

    return await interaction.editReply({ content: null, embeds: [embed] });
}

command.execDarkCurrency = async (interaction, models, params, client) => {
    const { darkcurrency } = params;
    const { usuario, cantidad } = darkcurrency
    const { Users } = models

    const user = await Users.getWork({ user_id: usuario.value, guild_id: usuario.member.guild.id })
    await user.addDarkCurrency(cantidad.value);

    let embed = new Embed()
        .defAuthor({ text: `¡Dinero para ti, ${usuario.member.displayName}!`, icon: usuario.member.guild.iconURL() })
        .defDesc(`**+** ${PrettyCurrency(interaction.guild, cantidad.value, { name: "DarkCurrency" })}
— ${PrettyCurrency(interaction.guild, user.getDarkCurrency(), { name: "DarkCurrency" })}`)
        .defColor(Colores.verde)
        .defThumbnail(usuario.member.displayAvatarURL());

    return await interaction.editReply({ content: null, embeds: [embed] });
}

module.exports = command;