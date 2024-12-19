const { CustomElements } = require("mongoose").models;
const { CommandInteraction, ModalSubmitInteraction } = require("discord.js");
const Embed = require("./Embed");
const { FindNewId } = require("./functions");
const { DoesntExistsError } = require("../errors");

class CustomEmbed extends Embed {
    /**
     * @param {CommandInteraction | ModalSubmitInteraction} interaction 
     */
    constructor(interaction) {
        super();
        this.interaction = interaction;
        this.indentifer = null;
    }

    /**
     * Guarda el Embed a la base de datos del servidor donde se haga la Interaction
     * @returns {Promise<CommandInteraction>}
     */
    async save() {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);

        const id = FindNewId(await CustomElements.find(), "embeds", "id")

        this.doc.addEmbed(this.raw(), id, this.identifier);
        await this.doc.save();

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha creado el Embed. Usa ${this.interaction.client.mentionCommand("elements embeds edit")} para hacerle cambios`,
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
     * @returns {Promise<CommandInteraction>}
     */
    async replace(id) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);
        let cstmEmbed = this.doc.getEmbed(id);
        let embed = this.raw();

        if (!cstmEmbed)
            throw new DoesntExistsError(this.interaction, `El Embed con ID \`${id}\``, "este servidor");

        if (embed.author || embed.title) {
            cstmEmbed.title = embed.author?.name ?? embed.title;
            cstmEmbed.urls.icon = embed.author?.icon_url;
        }

        if (embed.description) cstmEmbed.desc = embed.description;
        if (embed.timestamp) cstmEmbed.time = true;
        if (embed.footer) {
            cstmEmbed.footer = embed.footer.text;
            cstmEmbed.urls.footer = embed.footer.icon_url;
        }

        if (embed.color) cstmEmbed.color = embed.color;
        if (embed.image) cstmEmbed.urls.image = embed.image.url;

        await this.doc.save();

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha editado el Embed. Usa ${this.interaction.client.mentionCommand("elements send")} para enviarlo`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Elimina un Embed de la base de datos
     * @param {Integer} id La Id del Embed a eliminar
     * @returns {Promise<CommandInteraction>}
     */
    async delete(id) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);

        try {
            this.doc.deleteEmbed(id);
            await this.doc.save();

            return await this.interaction.editReply({
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
            console.log("🔴 %s", err);
            throw new DoesntExistsError(this.interaction, `El Embed con ID \`${id}\``, "este servidor");
        }
    }

    /**
     * Crea/edita un grupo de Embeds
     * @param {String} identifier 
     * @param {Integer[]} ids 
     * @param {Integer} id ID en caso de estar editando el grupo
     */
    async group(identifier, ids, id = null) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);
        if (!id) {
            const id = FindNewId(await CustomElements.find(), "groups.embeds");

            this.doc.groups.embeds.push({
                identifier,
                ids,
                id
            })

            await this.interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: [
                                `Se ha creado el Grupo. Usa ${this.interaction.client.mentionCommand("elements groups edit")} para hacerle cambios`,
                                `ID: ${id}`
                            ]
                        }
                    })
                ]
            })
        } else {
            let toEdit = this.doc.getEmbedGroup(id)
            if (identifier) toEdit.identifier = identifier;
            if (ids) toEdit.ids = ids;

            await this.interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: [
                                `Se ha editado el Grupo.`
                            ]
                        }
                    })
                ]
            })
        }

        await this.doc.save();
    }

    /**
     * Elimina un Grupo de Embeds de la base de datos
     * @param {Integer} id La Id del Embed a eliminar
     * @returns {Promise<CommandInteraction>}
     */
    async delete_group(id) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);

        try {
            this.doc.deleteEmbedGroup(id);
            await this.doc.save();

            return await this.interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: `Se ha eliminado el Grupo de Embeds`
                        }
                    })
                ]
            })
        } catch (err) {
            console.log("🔴 %s", err);
            throw new DoesntExistsError(this.interaction, `El Grupo de Embeds con ID \`${id}\``, "este servidor");
        }
    }

    /**
     * @param {{ title, desc, footer, color, urls }} params 
     * @param {String} identifier
     */
    create(params, identifier = "null") {
        if (identifier != "null") this.identifier = identifier
        const { title, desc, footer, color, urls } = params;

        const titulo = title?.value ?? title;
        const descr = desc?.value ?? desc;
        const foo = footer?.value ?? footer;
        const colorEmbed = color?.value ?? color;

        let urlObj = urls ?? {};
        if (typeof urls === "string") {
            let URLs = urls ? urls.split(",") : []
            URLs.forEach((u, i) => {
                u = u.replaceAll(/\s+/g, "") // quitar todos los espacios
                if (u.length === 0) u = null;

                URLs[i] = u;
            });

            console.log(URLs);

            urlObj = {
                image: URLs[0] ?? null,
                icon: URLs[1] ?? null,
                footer: URLs[2] ?? null
            }
        }

        const imag = urlObj.image;
        const icono = urlObj.icon;
        const fooicon = urlObj.footer;

        if (titulo) this.defAuthor({ text: titulo, icon: icono, title: icono ? false : true })
        if (foo) this.defFooter({ text: foo, icon: fooicon })
        try {
            if (colorEmbed) this.defColor(colorEmbed)
        } catch (err) {
            this.defColor("#000000")
        }
        if (descr) this.defDesc(descr)
        if (imag) this.defImage(imag)

        return this
    }
}


module.exports = CustomEmbed;