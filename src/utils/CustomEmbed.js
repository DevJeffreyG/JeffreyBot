const { CustomElements } = require("mongoose").models;
const { CommandInteraction } = require("discord.js");
const Embed = require("./Embed");
const { FindNewId } = require("./functions");

class CustomEmbed extends Embed {
    constructor(params) {
        super();
        if (params) this.#creation(params);
    }

    /**
     * Guarda el Embed a la base de datos del servidor donde se haga la Interaction
     * @param {CommandInteraction} interaction 
     */
    async save(interaction) {
        this.doc = await CustomElements.getOrCreate(interaction.guild.id);

        const id = FindNewId(await CustomElements.find(), "embeds", "id")

        this.doc.addEmbed(this.raw(), id);
        await this.doc.save();

        return interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha creado el Embed. Usa ${interaction.client.mentionCommand("embeds basic edit")} para hacerle cambios`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    #creation(params) {
        const { title, icon, desc, footer, footer_icon, time, img, color } = params;

        const titulo = title?.value ?? title;
        const icono = icon?.value ?? icon;
        const descr = desc?.value ?? desc;
        const foo = footer?.value ?? footer;
        const fooicon = footer_icon?.value ?? footer_icon;
        const tiempo = time?.value ?? time;
        const colorEmbed = color?.value ?? color;

        if (titulo) this.defAuthor({ text: titulo, icon: icono, title: icon ? false : true })
        if (foo) this.defFooter({ text: foo, icon: fooicon, timestamp: tiempo ?? false })
        if (colorEmbed) this.defColor(typeof colorEmbed === "number" ? colorEmbed : "#" + colorEmbed)
        if (descr) this.defDesc(descr)
    }
}


module.exports = CustomEmbed;