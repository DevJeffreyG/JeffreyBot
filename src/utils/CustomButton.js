const { CustomElements } = require("mongoose").models;
const { ButtonBuilder, CommandInteraction, ButtonStyle } = require("discord.js");
const { FindNewId, Confirmation } = require("./functions");
const Embed = require("./Embed");
const { BadParamsError, DiscordLimitationError, DoesntExistsError } = require("../errors");

class CustomButton extends ButtonBuilder {
    /**
     * @param {CommandInteraction | null} interaction 
     */
    constructor(interaction = null) {
        super();
        this.linked = null;
        this.interaction = interaction;
    }

    /**
     * Guarda el Botón a la base de datos del servidor
     * @returns {Promise<CommandInteraction>}
     */
    async save() {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);

        const id = FindNewId(await CustomElements.find(), "buttons", "id")

        this.doc.addButton(this.raw(), id, this.linked);
        await this.doc.save();

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha creado el Botón. Usa ${this.interaction.client.mentionCommand("elements buttons edit")} para hacerle cambios`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Reemplaza este CustomButton con otro en la base de datos
     * @param {Integer} id La Id del Botón a editar
     * @returns {Promise<CommandInteraction>}
     */
    async replace(id, params) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);
        let cstmButton = this.doc.getButton(id)

        if (!cstmButton)
            throw new DoesntExistsError(this.interaction, `El Botón con ID \`${id}\``, "este servidor");

        let buttonObj = new CustomButton(this.interaction).create(cstmButton);
        let button = new CustomButton(this.interaction).create({
            texto: params.texto?.value ?? buttonObj.data.label,
            emoji: params.emoji?.value ?? buttonObj.data.emoji?.id ?? buttonObj.data.emoji?.name,
            style: params.style?.value ?? buttonObj.data.style,
            link: params.link?.value ?? buttonObj.data.url,
            embedids: params.embedids?.value ?? cstmButton.embedids
        }).raw();

        let index = this.doc.buttons.findIndex(x => x.id === id);
        this.doc.buttons[index] = { ...button, id };

        await this.doc.save();

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha editado el Botón. Usa ${this.interaction.client.mentionCommand("elements buttons link")} para vincularlo a un Embed`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Elimina un Botón en la base de datos
     * @param {Integer} id La Id del Botón a eliminar
     * @returns {Promise<CommandInteraction>}
     */
    async delete(id) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);

        try {
            this.doc.deleteButton(id);
            await this.doc.save();

            return await this.interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: `Se ha eliminado el Botón`
                        }
                    })
                ]
            })
        } catch (err) {
            throw new DoesntExistsError(this.interaction, `El Botón con ID \`${id}\``, "este servidor");
        }
    }

    /**
     * 
     * @param {Integer} buttonId El Botón que se va a vincular
     * @param {Integer} embedId El Embed donde se va a vincular
     * @param {Boolean} autorole Es un AutoRole?
     */
    async linkWork(buttonId, embedId, autorole = false) {
        this.doc = await CustomElements.getWork(this.interaction.guild.id);

        const embed = this.doc.getEmbed(embedId);
        if (!embed)
            throw new DoesntExistsError(this.interaction, `El Embed con ID \`${embedId}\``, "este servidor");

        console.log(embed);

        if (embed.linkedids?.find(x => x.id === buttonId && x.isAutoRole === autorole)) {
            let confirmation = await Confirmation("Desvincular Elemento", [
                "A partir de ahora, cuando se envíe este Embed no se incluirá el Elemento"
            ], this.interaction)

            if (!confirmation) return;
            embed.linkedids.splice(embed.linkedids.findIndex(x => x.id === buttonId && x.isAutoRole === autorole), 1);
        } else {
            let confirmation = await Confirmation("Vincular Elemento", [
                "Se pondrá este Elemento abajo del Embed al enviarse a partir de ahora"
            ], this.interaction)

            if (!confirmation) return;

            if (embed.linkedids.length === 5 && !autorole)
                throw new DiscordLimitationError(this.interaction, ">5 Botones", [
                    "No pueden haber más de 5 botones por mensaje",
                    "Para continuar, desvincula un botón antes (usando este mismo comando)"
                ])

            embed.linkedids.push({ id: buttonId, isAutoRole: autorole });
        }

        await this.doc.save();
        return await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] })
    }

    raw() {
        return this.data;
    }

    /**
     * @param {{ texto: string, emoji: string, style: ButtonStyle, link: string, embedids: Array<number> }} params 
     */
    create(params) {
        const { texto, emoji, style, link, embedids, autorole } = params;

        const text = texto?.value ?? texto;
        const emote = emoji?.value ?? emoji;
        const sty = style?.value ?? style;
        const url = link?.value ?? link;
        const linkEmbed = embedids?.value ?? embedids;

        if (text) this.setLabel(text)
        if (emote) this.setEmoji(emote)
        if (sty) this.setStyle(Number(sty))
        else this.setStyle(ButtonStyle.Secondary);

        if (!emote && !text)
            throw new BadParamsError(this.interaction, "El Botón tiene que tener al menos texto o un emote");

        if (this.data.style === ButtonStyle.Link) {
            if (url) this.setURL(url)
            else {
                throw new BadParamsError(this.interaction, "Falta agregar una URL")
            }
        } else {
            if (url) {
                throw new BadParamsError(this.interaction, [
                    "No puedes usar una URL en un Botón que no sea de tipo Link"
                ])
            }
        }

        if (!url) {
            this.setCustomId("placeholder");

            if (linkEmbed) {
                this.linked = Array.isArray(linkEmbed) ? linkEmbed : null;
                if (!this.linked) {
                    this.linked = [];
                    linkEmbed.split(",").forEach(x => {
                        let y = Number(x);
                        if (!isNaN(y)) this.linked.push(y);
                    });
                }

                if (this.data.style === ButtonStyle.Link && this.linked.length > 0)
                    throw new BadParamsError(this.interaction, [
                        "No puedes crear un Botón tipo Link y mostrar Embeds con él"
                    ])

                if (this.linked.length > 10)
                    throw new DiscordLimitationError(this.interaction, ">10 Embeds", [
                        "No puedes enviar un sólo mensaje con más de 10 Embeds",
                        "Baja la cantidad"
                    ])
            } else {
                if (!autorole)
                    throw new BadParamsError(this.interaction, "Debes vincular al menos un Embed para mostrar si no es de tipo Link")
            }
        }

        return this
    }
}

module.exports = CustomButton;