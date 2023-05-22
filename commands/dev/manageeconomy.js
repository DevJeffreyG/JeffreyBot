const { Command, Categories, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "manageeconomy",
    desc: "Administra los balances de un usuario",
    category: Categories.Developer
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
            command.execCurrency(interaction, models, { subcommand, currency }, client)
            break;

        case "darkcurrency":
            command.execDarkCurrency(interaction, models, { subcommand, darkcurrency }, client)
            break;
    }
}

command.execCurrency = async (interaction, models, params, client) => {
    const { subcommand, currency } = params;
    const { usuario, cantidad } = currency
    const { Users } = models
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const user = await Users.getOrCreate({ user_id: usuario.value, guild_id: usuario.member.guild.id })

    await user.addCurrency(cantidad.value)

    let embed = new Embed()
        .defAuthor({ text: `¡Dinero para ti, ${usuario.member.user.tag}!`, icon: usuario.member.guild.iconURL() })
        .defDesc(`**+${Currency}${cantidad.value.toLocaleString('es-CO')}
— ${Currency}${user.economy.global.currency.toLocaleString('es-CO')}**`)
        .defColor(Colores.verde)
        .defThumbnail(usuario.member.displayAvatarURL());

    return interaction.editReply({ content: null, embeds: [embed] });
}

command.execDarkCurrency = async (interaction, models, params, client) => {
    const { subcommand, darkcurrency } = params;
    const { usuario, cantidad } = darkcurrency
    const { Users } = models
    const { DarkCurrency } = client.getCustomEmojis(interaction.guild.id);

    const user = await Users.getOrCreate({ user_id: usuario.value, guild_id: usuario.member.guild.id })
    await user.addDarkCurrency(cantidad.value);

    let embed = new Embed()
        .defAuthor({ text: `¡Dinero para ti, ${usuario.member.user.tag}!`, icon: usuario.member.guild.iconURL() })
        .defDesc(`**+${DarkCurrency}${cantidad.value.toLocaleString('es-CO')}
— ${DarkCurrency}${user.economy.dark.currency.toLocaleString('es-CO')}**`)
        .defColor(Colores.verde)
        .defThumbnail(usuario.member.displayAvatarURL());

    return interaction.editReply({ content: null, embeds: [embed] });
}

module.exports = command;