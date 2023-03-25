const { Command, Categories, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources")

const command = new Command({
    name: "find",
    desc: "Buscar el ID por nombre",
    category: Categories.Developer
});

command.addSubcommand({
    name: "emoji",
    desc: "Buscar emoji por nombre"
})

command.addSubcommand({
    name: "role",
    desc: "Buscar role por nombre"
})

command.addOption({
    type: "string",
    name: "nombre",
    desc: "Nombre del emoji",
    req: true,
    sub: "emoji"
})

command.addOption({
    type: "string",
    name: "id",
    desc: "Id del server",
    sub: "emoji"
})

command.addOption({
    type: "string",
    name: "nombre",
    desc: "Nombre del role",
    req: true,
    sub: "role"
})

command.addOption({
    type: "string",
    name: "id",
    desc: "Id del server",
    sub: "role"
})


command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { subcommand } = params

    const name = params[subcommand].nombre.value;
    const id = params[subcommand].id;

    const guild = id && id.value ? client.guilds.cache.find(x => x.id === id.value) : interaction.guild;

    // Comando

    switch (subcommand) {
        case "emoji": {
            const emoji = guild.emojis.cache.find(x => x.name === name);
            if (!emoji) return interaction.editReply({ content: `No encontré ese emoji, verifica que hayas escrito bien el nombre.` });

            let finalEmbed = new Embed()
                .defImage(emoji.url)
                .defAuthor({ text: `Emoji: ${name}`, icon: emoji.url })
                .defDesc(`**—** Nombre del Role: \`${name}\`.
**—** ID: \`${emoji.id}\`.
**—** Es animado: \`${emoji.animated ? "Sí" : "No"}\`.
**—** Emoji del server: \`${guild.name}\`.`)
                .defColor(Colores.verde);

            return interaction.editReply({ content: null, embeds: [finalEmbed] });
        }

        case "role": {
            const role = guild.roles.cache.find(x => x.name === name);
            if (!role) return interaction.editReply({ content: `No encontré el rol \`${name}\` asegúrate de haberlo escrito bien.` });

            let finalEmbed = new Embed()
                .defAuthor({ text: `Role: ${name}`, icon: guild.iconURL() })
                .defDesc(`**—** Nombre del Role: \`${name}\`.
**—** ID: \`${role.id}\`.
**—** Role del servidor: \`${guild.name}\`.`)
                .defColor(role.hexColor);

            return interaction.editReply({ content: null, embeds: [finalEmbed] });
        }
    }
}

module.exports = command;