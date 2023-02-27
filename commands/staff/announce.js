// TODO: Mover JBNews a /dev y hacer un verdadero comando de anuncios con esta misma estructura :o
const { Command, Categories, Embed, ErrorEmbed, Confirmation} = require("../../src/utils")
const { Bases, Colores } = require("../../src/resources")

const command = new Command({
    name: "announce",
    desc: "Comandos para anunciar cosas",
    category: Categories.Administration
})

command.data
    .addSubcommand(sub => sub
        .setName("jbnews")
        .setDescription("Se crea un anuncio mencionando al rol de JB News")
        .addStringOption(option => option
            .setName("anuncio")
            .setDescription("El anuncio a enviar"))
        .addAttachmentOption(option => option
            .setName("imagen")
            .setDescription("La imagen a poner en el embed"))
        .addStringOption(option => option
            .setName("titulo")
            .setDescription("El título que saldrá en el embed"))
    )

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { Guilds } = models;
    const { subcommand } = params;
    const { titulo, anuncio, imagen } = params[subcommand];

    const doc = await Guilds.getOrCreate(interaction.guild.id)

    switch (subcommand) {
        case "jbnews":
            let jbNRole = await interaction.guild.roles.fetch(Bases.owner.roles.jbNewsRole);
            let ch = interaction.guild.channels.cache.get(doc.getChannel("general.announcements"));

            if (!anuncio && !imagen) return interaction.editReply({ embeds: [new ErrorEmbed({ type: "badParams", data: { help: "Si no hay 'anuncio' debe haber una imagen." } })] });
            if (titulo) title = titulo.value;
            else title = "¡Novedades de Jeffrey Bot!"

            let embed = new Embed()
                .defColor(Colores.verde)
                .defFooter({ text: `Noticia por ${interaction.user.tag}`, icon: client.user.displayAvatarURL(), timestamp: true })

            if (imagen) embed.setImage(imagen.attachment.url);
            if (anuncio) embed.defDesc(anuncio.value)
            else embed.defDesc(" ")

            if (!anuncio && embed.image) {
                embed.defAuthor({ text: title, icon: guild.iconURL() })
            } else if (anuncio && imagen) {
                embed.defAuthor({ text: title, title: true });
                embed.defThumbnail(client.user.displayAvatarURL());
            } else {
                embed.defAuthor({ text: title, title: true });
            }

            let toConfirm = [
                "El anuncio se verá como lo ves aquí:",
                embed
            ]
            let confirmation = await Confirmation("Enviar anuncio", toConfirm, interaction)
            if (!confirmation) return;

            ch.send({ content: `${jbNRole}`, embeds: [embed] });
            return confirmation.editReply({ content: `${client.Emojis.Check} Anuncio enviado a ${ch}!`, embeds: [] });
    }
}

module.exports = command;