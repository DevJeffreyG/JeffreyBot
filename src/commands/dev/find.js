const { Command, Embed } = require("../../utils")
const { Colores } = require("../../resources");
const { Emoji } = require("discord.js");

const command = new Command({
    name: "find",
    desc: "Buscar el ID por nombre"
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

    const guild = id && id.value ? client.guilds.cache.get(id.value) ?? interaction.guild : interaction.guild;
    // Comando

    switch (subcommand) {
        case "emoji": {
            const emoji = client.EmojisObject[name] ?? guild.emojis.cache.find(x => x.name === name);
            if (!emoji) return await interaction.editReply({ content: `No encontré ese emoji, verifica que hayas escrito bien el nombre.` });

            const emojiURL = emoji instanceof Emoji ? emoji.imageURL() : emoji.url;

            let finalEmbed = new Embed()
                .defImage(emojiURL)
                .defAuthor({ text: `Emoji: ${name}`, icon: emojiURL })
                .defDesc(`**—** Mención del Emoji: \`${emoji.mention ?? emoji.toString()}\`.
**—** Nombre del Emoji: \`${name}\`.
**—** ID: \`${emoji.id}\`.
**—** Es animado: \`${emoji.animated ? "Sí" : "No"}\`.
**—** Emoji del server: \`${guild.name}\`.`)
                .defColor(Colores.verde);

            return await interaction.editReply({ content: null, embeds: [finalEmbed] });
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

            return await interaction.editReply({ content: null, embeds: [finalEmbed] });
        }
    }
}

module.exports = command;