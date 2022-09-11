const { Command, Categories, Embed, ErrorEmbed, Confirmation} = require("../../src/utils")
const { Config, Colores } = require("../../src/resources")

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

    const { subcommand } = params;
    const { titulo, anuncio, imagen } = params[subcommand];

    switch (subcommand) {
        case "jbnews":
            let jbNRole = client.user.id === Config.testingJBID ? interaction.guild.roles.cache.find(x => x.id === '790393911519870986') : interaction.guild.roles.cache.find(x => x.id === Config.jbnews);
            let ch = client.user.id === Config.testingJBID ? interaction.guild.channels.cache.find(x => x.id === "483007967239602196") : interaction.guild.channels.cache.find(x => x.id === Config.announceChannel);

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
            return confirmation.editReply({ content: `✅ Anuncio enviado a ${ch}!`, embeds: [] });
    }
}

module.exports = command;