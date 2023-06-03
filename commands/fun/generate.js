const { Command, Categories, FilePages, Embed, GetRandomItem } = require("../../src/utils")
const craiyon = require("craiyon");
const ms = require("ms")
const { AttachmentBuilder } = require("discord.js");
const { Colores } = require("../../src/resources");
const Cr = new craiyon.Client();

const command = new Command({
    name: "generate",
    desc: "Genera imágenes que parecen shitposts con una inteligencia artificial",
    helpdesc: "Genera 9 imágenes de acuerdo a una descripción. Esta es una IA básica y lo que se genera no va a ser lo que buscas, a menos que quieras material para shitposts"
})

command.addOption({
    type: "string",
    name: "descripcion",
    desc: "¿Qué quieres que la IA recree?",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    if (!interaction.deferred) await interaction.deferReply();

    const { descripcion } = params;

    console.log("⚪ Prompt: %s", descripcion.value)

    let masterpieces = () => {
        let msgs = [
            "Creando obras maestras...? No, no esperes mucho.",
            "Creando contenido directito de las fauces del infierno.",
            "Las amalgamas se están juntando...",
            "Ya casi estamos ahí, sólo espera un poco más.",
            "Lo veo y no lo creo...",
            "Esto es increíble, tienes que verlo.",
            "Ya casi están tus obras.",
            "No te imaginarías nunca lo que vas a ver.",
            "Algo me dice que esto es nuevo..."
        ];

        interaction.editReply({
            embeds: [
                new Embed()
                    .defAuthor({ text: GetRandomItem(msgs), icon: client.EmojisObject.Loading.url })
                    .defColor(Colores.verde)
            ]
        }).catch(err => console.log(err));
    }
    
    masterpieces();
    let interval = setInterval(masterpieces, ms("15s"))

    try {
        var generated = await Cr.generate({
            prompt: descripcion.value
        })
    } catch (err) {
        console.log(err);
        return interaction.editReply({ content: "No se pudieron crear tus obras maestras por un error con el servidor :(", embeds: [] }).catch(err => console.log(err))
    }

    clearInterval(interval)

    interaction.editReply({
        embeds: [
            new Embed()
                .defAuthor({ text: "Guardando los resultados...", icon: client.EmojisObject.Loading.url })
                .defColor(Colores.verde)
        ]
    }).catch(err => console.log(err));

    const images = generated.images;
    const files = [];

    for (const image of images) {
        let buffer = image.asBuffer();
        let att = new AttachmentBuilder(buffer)
        files.push(att);
    }

    let interactive = new FilePages(files)
    try {
        await interactive.init(interaction);
    } catch(err) {
        console.log(err)
    }
}

module.exports = command