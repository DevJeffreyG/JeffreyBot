const { CustomElements } = require("mongoose").models;
const { CommandInteraction, codeBlock } = require("discord.js");
const Embed = require("./Embed");
const { FindNewId } = require("./functions");
const { DoesntExistsError } = require("../errors");

class CustomEmbed extends Embed {
    constructor(params) {
        super();
        if (params) this.#creation(params);
    }

    /**
     * Guarda el Embed a la base de datos del servidor donde se haga la Interaction
     * @param {CommandInteraction} interaction 
     * @returns {Promise<CommandInteraction>}
     */
    async save(interaction) {
        this.doc = await CustomElements.getOrCreate(interaction.guild.id);

        const id = FindNewId(await CustomElements.find(), "embeds", "id")

        this.doc.addEmbed(this.raw(), id);
        await this.doc.save();

        return await interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha creado el Embed. Usa ${interaction.client.mentionCommand("elements embeds edit")} para hacerle cambios`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Reemplaza este CustomEmbed con otro en la base de datos
     * @param {Integer} id La Id del Embed a editar
     * @param {CommandInteraction} interaction 
     * @returns {Promise<CommandInteraction>}
     */
    async replace(id, interaction) {
        this.doc = await CustomElements.getOrCreate(interaction.guild.id);
        let cstmEmbed = this.doc.getEmbed(id);
        let embed = this.raw();

        if (!cstmEmbed)
            throw new DoesntExistsError(interaction, `El Embed con ID \`${id}\``, "este servidor");

        if (embed.author || embed.title) {
            cstmEmbed.title = embed.author?.name ?? embed.title;
            cstmEmbed.icon = embed.author?.icon_url;
        }

        if (embed.description) cstmEmbed.desc = embed.description;
        if (embed.timestamp) cstmEmbed.time = true;
        if (embed.footer) {
            cstmEmbed.footer = embed.footer.text;
            cstmEmbed.footer_icon = embed.footer.icon_url;
        }

        if (embed.color) cstmEmbed.color = embed.color;

        await this.doc.save();

        return await interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha editado el Embed. Usa ${interaction.client.mentionCommand("elements send")} para enviarlo`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Elimina un Embed en la base de datos
     * @param {Integer} id La Id del Embed a eliminar
     * @param {CommandInteraction} interaction 
     * @returns {Promise<CommandInteraction>}
     */
    async delete(id, interaction) {
        this.doc = await CustomElements.getOrCreate(interaction.guild.id);

        try {
            this.doc.deleteEmbed(id);
            await this.doc.save();

            return await interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: `Se ha eliminado el Embed`
                        }
                    })
                ]
            })
        } catch (err) {
            throw new DoesntExistsError(interaction, `El Embed con ID \`${id}\``, "este servidor");
        }
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
        try {
            if (colorEmbed) this.defColor(colorEmbed)
        } catch (err) {
            this.defColor("#000000")
        }
        if (descr) this.defDesc(descr)
    }
}


module.exports = CustomEmbed;