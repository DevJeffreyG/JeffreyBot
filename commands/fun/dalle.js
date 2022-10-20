const { Command, Categories, FilePages } = require("../../src/utils")
const craiyon = require("craiyon");
const { AttachmentBuilder } = require("discord.js");
const Cr = new craiyon.Client();

const command = new Command({
    name: "dall-e",
    desc: "Genera imágenes que parecen shitposts con una inteligencia artificial",
    helpdesc: "Genera 9 imágenes de acuerdo a una descripción, esta es una IA básica y lo que se genera no va a ser lo que buscas, a menos que quieras materal para shitposts.",
    category: Categories.Fun
})

command.addOption({
    type: "string",
    name: "descripcion",
    desc: "¿Qué quieres que la IA recree?",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { descripcion } = params;
    const { Emojis } = client;

    console.log("⚪ Prompt: %s", descripcion.value)

    interaction.editReply({content: `${Emojis.Loading} Creando obras maestras...? No, no esperes mucho.`});

    let generated = await Cr.generate({
        prompt: descripcion.value
    })

    interaction.editReply({content: `${Emojis.Loading} Guardando los resultados...`});

    const images = generated.images;
    const files = [];

    for(const image of images) {
        let buffer = image.asBuffer();
        let att = new AttachmentBuilder(buffer)
        files.push(att);
    }
    
    let interactive = new FilePages(files)
    interactive.init(interaction);
}

module.exports = command