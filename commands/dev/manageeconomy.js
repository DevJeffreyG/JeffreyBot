const { Command, Embed } = require("../../src/utils")
const { Emojis, Colores } = require("../../src/resources")

const command = new Command({
    name: "manageeconomy",
    desc: "Administra Jeffros o DarkJeffros de un usuario",
    category: "DEV"
});

command.addSubcommandGroup({
    name: "jeffros",
    desc: "Administra los Jeffros de alguien"
})

command.addSubcommandGroup({
    name: "darkjeffros",
    desc: "Administra los DarkJeffros de alguien"
})

command.addSubcommand({
    name: "add",
    desc: "Añadir Jeffros a alguien",
    group: "jeffros"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "Usuario al que le vas a agregar Jeffros",
    req: true,
    sub: "jeffros.add"
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "N# de Jeffros a agregar",
    req: true,
    min: 1,
    sub: "jeffros.add"
})

command.addSubcommand({
    name: "add",
    desc: "Añadir DarkJeffros a alguien",
    group: "darkjeffros"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "Usuario al que le vas a agregar DarkJeffros",
    req: true,
    sub: "darkjeffros.add"
})

command.addOption({
    type: "integer",
    name: "cantidad",
    desc: "N# de DarkJeffros a agregar",
    req: true,
    min: 1,
    sub: "darkjeffros.add"
})

command.execute = async(interaction, models, params, client) => {
    await interaction.deferReply();

    const { subgroup, subcommand, jeffros, darkjeffros } = params

    switch(subgroup){
        case "jeffros":
            command.execJeffros(interaction, models, {subcommand, jeffros}, client)
            break;

        case "darkjeffros":
            command.execDarkJeffros(interaction, models, {subcommand, darkjeffros}, client)
            break;
    }
}

command.execJeffros = async (interaction, models, params, client) => {
    const { subcommand, jeffros } = params;
    const { usuario, cantidad } = jeffros
    const { Users } = models

    const user = await Users.getOrCreate({user_id: usuario.value, guild_id: usuario.member.guild.id})

    await user.addJeffros(cantidad.value)

    let embed = new Embed()
    .defAuthor({text: `¡Jeffros para ti, ${usuario.member.user.tag}!`, icon: usuario.member.guild.iconURL()})
    .defDesc(`**+${Emojis.Jeffros}${cantidad.value.toLocaleString('es-CO')}
— ${Emojis.Jeffros}${user.economy.global.jeffros.toLocaleString('es-CO')}**`)
    .defColor(Colores.verde)
    .defThumbnail(usuario.member.displayAvatarURL());

    return interaction.editReply({content: null, embeds: [embed]});
}

command.execDarkJeffros = async (interaction, models, params, client) => {
    const { subcommand, jeffros } = params;
    const { usuario, cantidad } = jeffros
    const { Users } = models

    const user = await Users.getOrCreate({user_id: usuario.value, guild_id: usuario.member.guild.id})

    user.economy.dark.darkjeffros += cantidad.value;
    await user.save();

    let embed = new Embed()
    .defAuthor({text: `¡DarkJeffros para ti, ${usuario.member.user.tag}!`, icon: usuario.member.guild.iconURL()})
    .defDesc(`**+${Emojis.Dark}${cantidad.value.toLocaleString('es-CO')}
— ${Emojis.Dark}${user.economy.dark.darkjeffros.toLocaleString('es-CO')}**`)
    .defColor(Colores.verde)
    .defThumbnail(usuario.member.displayAvatarURL());

    return interaction.editReply({content: null, embeds: [embed]});
}

module.exports = command;